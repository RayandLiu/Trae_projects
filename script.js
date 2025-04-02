document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // 显示欢迎消息
    addMessage('你好！我是你的AI生活教练。请告诉我你想要在哪些方面得到提升和帮助？', 'ai');

    // 发送消息事件
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // 添加用户消息
        addMessage(message, 'user');
        userInput.value = '';

        // 添加AI思考消息
        const thinkingMsg = addMessage('思考中...', 'ai');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            // 获取文本响应
            const aiResponse = await response.text();
            
            // 移除"思考中"消息
            chatMessages.removeChild(thinkingMsg);
            
            // 添加AI回复
            addMessage(aiResponse, 'ai');
        } catch (error) {
            console.error('发送消息错误:', error);
            chatMessages.removeChild(thinkingMsg);
            addMessage('抱歉，出现了一些问题。请稍后再试。', 'ai');
        }
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }
}); 