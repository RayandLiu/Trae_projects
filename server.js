import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 环境变量配置
dotenv.config();

// 添加调试信息
console.log('正在初始化服务器...');
console.log('当前工作目录:', __dirname);

const app = express();
const PORT = process.env.PORT || 3000;

// API配置
const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const MODEL_NAME = process.env.MODEL_NAME;

if (!API_KEY || !API_URL || !MODEL_NAME) {
    console.error('错误：缺少必要的环境变量');
    process.exit(1);
}

// 中间件设置
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(cors());

// 添加一个简单的根路由用于测试
app.get('/', async (req, res) => {
    console.log('收到首页请求');
    try {
        const indexPath = path.join(__dirname, 'index.html');
        console.log('尝试发送文件:', indexPath);
        res.sendFile(indexPath);
    } catch (error) {
        console.error('发送文件时出错:', error);
        res.status(500).send('服务器错误');
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        api_url: API_URL,
        api_key_exists: !!API_KEY
    });
});

// 聊天API
app.post('/api/chat', async (req, res) => {
    console.log('收到聊天请求:', req.body);
    
    if (!req.body.message) {
        return res.status(400).json({ error: '消息不能为空' });
    }

    try {
        // 直接响应纯文本
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        console.log('API请求URL:', API_URL);
        console.log('API密钥:', API_KEY ? '已配置' : '未配置');
        console.log('请求消息:', req.body.message);
        
        const response = await axios({
            method: 'post',
            url: API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            data: {
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'system',
                        content: '你是一位专业的生活教练，擅长倾听、分析并给出实用的建议。'
                    },
                    {
                        role: 'user',
                        content: req.body.message
                    }
                ],
                temperature: 0.6,
                stream: false
            },
            timeout: 60000
        });
        
        console.log('API响应:', response.data);
        
        // 检查响应是否包含预期的内容
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const aiResponse = response.data.choices[0].message.content;
            res.send(aiResponse);
        } else {
            console.error('API响应格式不符合预期:', response.data);
            res.status(500).send('API响应格式错误');
        }
    } catch (error) {
        console.error('API请求错误:', error.message);
        if (error.response) {
            console.error('错误状态码:', error.response.status);
            console.error('错误响应数据:', JSON.stringify(error.response.data));
        }
        
        let errorMessage = 'AI服务请求失败';
        if (error.response?.data?.error?.code === 'ModelNotOpen') {
            errorMessage = 'DeepSeek R1模型服务未激活，请检查Ark控制台设置';
        }
        
        res.status(error.response?.status || 500).send(errorMessage);
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message
    });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器成功运行在 http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('启动服务器时出错:', err);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});