// ページが読み込まれた時の処理
console.log('Content script loaded');

// 初期値が設定されたかどうかを追跡するフラグ
let initialPromptSet = false;

// Angularのイベントをトリガーする関数
function triggerAngularEvent(element, eventName) {
  const ngZone = window.ng?.getAngularTestability(element)?.getZone();
  if (ngZone) {
    ngZone.run(() => {
      const event = new Event(eventName, { bubbles: true });
      element.dispatchEvent(event);
    });
  } else {
    // ngZoneが見つからない場合は通常のイベントを試す
    const event = new Event(eventName, { bubbles: true });
    element.dispatchEvent(event);
  }
}

// プロンプトを設定する関数
function setInitialPrompt() {
  if (initialPromptSet) return;

  chrome.storage.sync.get(['initialPrompt'], (result) => {
    if (result.initialPrompt) {
      const promptInput = document.querySelector('.query-box-input');
      if (promptInput) {
        promptInput.value = result.initialPrompt;
        // Angularの変更イベントをトリガー
        triggerAngularEvent(promptInput, 'input');
        initialPromptSet = true;
      }
    }
  });
}

// リフレッシュボタンのクリックイベントを監視する関数
function observeRefreshButton() {
  const refreshButton = document.querySelector('.refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      const refreshButtons = document.querySelectorAll('.refresh-button');
      if (refreshButtons.length > 0) {
        refreshButtons[refreshButtons.length - 1].addEventListener('click', () => {
          // リフレッシュボタンがクリックされたら、初期値フラグをリセット
          initialPromptSet = false;
          // 少し待ってから初期値を再設定
          setTimeout(setInitialPrompt, 500);
        });
      }
    });
  }
}

// 削除ボタンを追加する関数
function addDeleteButton() {
  const allSourcesSpan = document.querySelector('span[name=allsources]');
  if (allSourcesSpan) {
    // 既存のボタンがなければ追加
    if (!allSourcesSpan.nextElementSibling?.classList?.contains('delete-button')) {
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '削除';
      deleteButton.className = 'delete-button';
      deleteButton.style.marginLeft = '10px';
      deleteButton.style.padding = '4px 8px';
      deleteButton.style.backgroundColor = '#ff4444';
      deleteButton.style.color = 'white';
      deleteButton.style.border = 'none';
      deleteButton.style.borderRadius = '4px';
      deleteButton.style.cursor = 'pointer';

      deleteButton.addEventListener('click', async () => {
        // チェックされた要素を取得
        const checkedElements = document.querySelectorAll('.single-source-container mat-checkbox input[type=checkbox]:checked');
        
        // チェックされた要素の数が0の場合は処理を中断
        if (checkedElements.length === 0) {
          window.alert('削除する項目が選択されていません。');
          return;
        }

        // 確認ダイアログを表示
        const confirmed = window.confirm(`${checkedElements.length}件の項目を削除します。よろしいですか？`);
        if (!confirmed) {
          return;
        }

        // チェックされた要素の情報をログに出力
        for (const [index, checkbox] of checkedElements.entries()) {
          // 少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const container = checkbox.closest('.single-source-container');
          const sourceName = container?.querySelector('.source-name')?.textContent || 'Unknown';
 
          console.log(`選択されたソース ${index + 1}:`, {
            sourceName,
            element: checkbox
          });
         
          // マウスオーバーイベントをシミュレート
          const iconAndMenuContainer = container?.querySelector('.icon-and-menu-container');
          if (iconAndMenuContainer) {
            // Angularのマウスオーバーイベントをトリガー
            triggerAngularEvent(iconAndMenuContainer, 'mouseenter');
            
            // 少し待機
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // メニューボタンを探してクリック
            const moreButton = iconAndMenuContainer.querySelector('.source-item-more-button');
            if (moreButton) {
              triggerAngularEvent(moreButton, 'click');
              
              // メニューが表示されるのを待機
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // 削除メニュー項目を探してクリック
              const deleteMenuItem = document.querySelector('.more-menu-delete-source-button');
              if (deleteMenuItem) {
                triggerAngularEvent(deleteMenuItem, 'click');
              }
 
              // ダイアログが表示されるのを待機
              await new Promise(resolve => setTimeout(resolve, 500));

              // 削除ボタンを探してクリック
              const deleteButton = document.querySelector('.delete-source-container button.submit');
              if (deleteButton) {
                deleteButton.click();
                // triggerAngularEvent(deleteButton, 'click');
              }
            }
          }
        }
      });

      allSourcesSpan.parentNode.insertBefore(deleteButton, allSourcesSpan.nextSibling);
    }
  }
}

// 一括生成ボタンを追加する関数
function addBulkGenerateButton() {
  const containers = document.querySelectorAll('.custom-audio-action-container > .icon-text-container');
  containers.forEach(container => {
    // 既にボタンが追加されていないか確認
    if (!container.querySelector('.bulk-generate-button')) {
      const button = document.createElement('button');
      button.textContent = '一括生成';
      button.className = 'bulk-generate-button';
      button.style.marginLeft = '10px';
      button.style.padding = '4px 8px';
      button.style.backgroundColor = '#1a73e8';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.addEventListener('click', () => {
        // 既存のダイアログがあれば削除
        const oldDialog = document.querySelector('.bulk-generate-dialog');
        if (oldDialog) oldDialog.remove();

        // ダイアログの作成
        const dialog = document.createElement('div');
        dialog.className = 'bulk-generate-dialog';
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.background = 'white';
        dialog.style.border = '1px solid #ccc';
        dialog.style.borderRadius = '8px';
        dialog.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
        dialog.style.padding = '24px 20px 16px 20px';
        dialog.style.zIndex = '9999';
        dialog.style.minWidth = '320px';

        // フォーム内容
        dialog.innerHTML = `
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 18px; color: #222;">一括生成</div>
          <div style="margin-bottom: 12px;">
            <label style='color: #222; font-weight: 500;'>開始の章：<input type="number" class="bulk-generate-start" style="width: 100px; margin-left: 8px; padding: 4px; border: 1px solid #bbb; border-radius: 4px; color: #222; background: #fff;"></label>
          </div>
          <div style="margin-bottom: 12px;">
            <label style='color: #222; font-weight: 500;'>終了の章：<input type="number" class="bulk-generate-end" style="width: 100px; margin-left: 8px; padding: 4px; border: 1px solid #bbb; border-radius: 4px; color: #222; background: #fff;"></label>
          </div>
          <div style="margin-bottom: 8px;">
            <label style='color: #222; font-weight: 500;'>焦点内容：<br><textarea class="bulk-generate-focus" rows="4" style="width: 100%; margin-top: 4px; padding: 6px; border: 1px solid #bbb; border-radius: 4px; color: #222; background: #fff;">$n章にのみ焦点を当ててください。</textarea></label>
          </div>
          <div style="margin-bottom: 10px; color: #666; font-size: 13px;">※ <code>$n</code> は章番号で置換されます</div>
          <div style="text-align: right;">k
            <button class="bulk-generate-cancel" style="margin-right: 8px; padding: 6px 16px; background: #f5f5f5; color: #222; border: 1px solid #bbb; border-radius: 4px; cursor: pointer; font-weight: 500;">キャンセル</button>
            <button class="bulk-generate-ok" style="padding: 6px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">OK</button>
          </div>
        `;

        // キャンセルボタンでダイアログを閉じる
        dialog.querySelector('.bulk-generate-cancel').addEventListener('click', () => {
          dialog.remove();
        });

        dialog.querySelector('.bulk-generate-ok').addEventListener('click', () => {
          // 入力値を取得して変数に保存
          const startChapter = dialog.querySelector('.bulk-generate-start').value;
          const endChapter = dialog.querySelector('.bulk-generate-end').value;
          const focusText = dialog.querySelector('.bulk-generate-focus').value;
          const currentChapter = startChapter;
          const processing = false; // 生成中かどうかのフラグ

          // 必要に応じてグローバル変数やwindowオブジェクトに保存も可能
          // ここではローカル変数として保存例
          window.bulkGenerateInput = {
            startChapter,
            endChapter,
            focusText,
            currentChapter,
            processing
          };

          dialog.remove();
          handleBulkGenerateOk();
        });

        document.body.appendChild(dialog);
      });
      container.appendChild(button);
    }
  });
}

// OKボタンでダイアログを閉じて .custom-audio .customize-button をクリック
function handleBulkGenerateOk() {
  console.log("handleBulkGenerateOk. bulkGenerateInput: %o", window.bulkGenerateInput);

  const customizeBtn = document.querySelector('.custom-audio .customize-button');
  if (customizeBtn) {
    customizeBtn.click();

    setTimeout(() => {
      const focusInput = document.querySelector('.episode-focus-input');
      console.log("focusInput: %o, bulkGenerateInput: %o", focusInput, window.bulkGenerateInput);
      if (focusInput && window.bulkGenerateInput) {
        if (window.bulkGenerateInput.currentChapter > window.bulkGenerateInput.endChapter) {
          console.log("bulkGenerateInput reset");
          window.bulkGenerateInput = null;
          return;
        }

        setTimeout(() => {
          // $n を開始の章番号で置換
          const replaced = window.bulkGenerateInput.focusText.replace(/\$n/g, window.bulkGenerateInput.currentChapter);
          console.log("replaced: %o", replaced);
          focusInput.value = replaced;
          triggerAngularEvent(focusInput, 'input');
        
          // 生成ボタンをクリック
          const generateBtn = document.querySelector('.custom-audio .generate-button');
          if (generateBtn) {
            window.bulkGenerateInput.processing = true;
            triggerAngularEvent(generateBtn, 'click');

            // 閉じるボタンをクリック
            const closeBtn = document.querySelector('.producer-close-button');
            if (closeBtn) {
              triggerAngularEvent(closeBtn, 'click');
            }

            window.bulkGenerateInput.currentChapter++;

            // 生成されるのを監視する
            monitorAudioControlsMenu();
          }
        }, 500);
      }
    }, 500);
  }
}

// 追加: processing中に .audio-controls .audio-controls-button が表示されている場合、その下の a.mat-mdc-menu-content をクリック
async function monitorAudioControlsMenu() {
  console.log("monitorAudioControlsMenu. bulkGenerateInput: %o", window.bulkGenerateInput);

  if (window.bulkGenerateInput && window.bulkGenerateInput.processing) {
    const audioButton = document.querySelector('.audio-controls .audio-controls-button.menu-button');
    if (audioButton) {
      console.log("audioButton found");
      window.bulkGenerateInput.processing = false;

      triggerAngularEvent(audioButton, 'click');
      await sleep(500);
    
      // audioButtonの親要素から a.mat-mdc-menu-content を探す
      const downloadContent = document.querySelector('.cdk-overlay-pane a.mat-mdc-menu-item');
      if (downloadContent) {
        downloadContent.click();
      }

      // 削除ボタンをクリックする
      const deleteButton = document.querySelector('.cdk-overlay-pane .delete-button');
      if (deleteButton) {
        deleteButton.click();
        // triggerAngularEvent(deleteButton, 'click');

        // 削除確認のボタンをクリック
        await sleep(2000);
        const deleteConfirmButton = document.querySelector('.yes-button');
        if (deleteConfirmButton) {
          triggerAngularEvent(deleteConfirmButton, 'click');

          // 次の章を生成する
          await sleep(1000);
          handleBulkGenerateOk();
        }
      }

      // 10sごとに再チェック
      setTimeout(monitorAudioControlsMenu, 10000);
    }
    // 1sごとに再チェック
    setTimeout(monitorAudioControlsMenu, 10000);
  } else {
    // processingがfalseになったら監視停止
    return;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ページの変更を監視
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      addDeleteButton();
      setInitialPrompt();
      observeRefreshButton();
      addBulkGenerateButton();
    }
  });
});

// 監視を開始
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 初期実行
addDeleteButton();
setInitialPrompt();
observeRefreshButton();
addBulkGenerateButton();

// メッセージをバックグラウンドスクリプトに送信
chrome.runtime.sendMessage({ type: 'contentScriptLoaded' }, (response) => {
  console.log('Response from background:', response);
}); 