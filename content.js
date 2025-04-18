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

// ページの変更を監視
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      addDeleteButton();
      setInitialPrompt();
      observeRefreshButton();
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

// メッセージをバックグラウンドスクリプトに送信
chrome.runtime.sendMessage({ type: 'contentScriptLoaded' }, (response) => {
  console.log('Response from background:', response);
}); 