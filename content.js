// ページが読み込まれた時の処理
console.log('Content script loaded');

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

// メッセージをバックグラウンドスクリプトに送信
chrome.runtime.sendMessage({ type: 'contentScriptLoaded' }, (response) => {
  console.log('Response from background:', response);
}); 