document.addEventListener('DOMContentLoaded', () => {
  const promptText = document.getElementById('promptText');
  const saveButton = document.getElementById('saveButton');

  // 保存されたプロンプトを読み込む
  chrome.storage.sync.get(['initialPrompt'], (result) => {
    if (result.initialPrompt) {
      promptText.value = result.initialPrompt;
    }
  });

  // 保存ボタンのクリックイベント
  saveButton.addEventListener('click', () => {
    const prompt = promptText.value.trim();
    chrome.storage.sync.set({ initialPrompt: prompt }, () => {
      // 保存完了メッセージを表示
      const message = document.createElement('div');
      message.textContent = '保存しました';
      message.style.color = 'green';
      message.style.marginTop = '10px';
      document.querySelector('.container').appendChild(message);
      
      // 3秒後にメッセージを削除
      setTimeout(() => {
        message.remove();
      }, 3000);
    });
  });
}); 