const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建上传文件夹
const uploadsDir = path.join(__dirname, 'uploads');
const framesDir = path.join(__dirname, 'frames');
const tempDir = path.join(__dirname, 'temp');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(framesDir);
fs.ensureDirSync(tempDir);

// 存储上传的视频
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传视频文件！'), false);
    }
  }
});

// 提供静态文件访问
app.use('/frames', express.static(framesDir));

// 提取视频帧的API
app.post('/api/extract-frames', upload.single('video'), async (req, res) => {
  try {
    let videoPath;
    let isTemp = false;
    
    // 处理视频文件上传或URL
    if (req.file) {
      // 从上传的文件中获取视频路径
      videoPath = req.file.path;
    } else if (req.body.videoUrl) {
      // 从URL下载视频
      videoPath = await downloadVideo(req.body.videoUrl);
      isTemp = true;
    } else {
      return res.status(400).json({ message: '请提供视频文件或URL' });
    }
    
    // 获取提取选项
    const fps = req.body.fps === 'all' ? null : parseFloat(req.body.fps) || 1;
    const quality = req.body.quality || 'high';
    const format = req.body.format || 'jpg';
    const startTime = req.body.startTime ? parseFloat(req.body.startTime) : null;
    const endTime = req.body.endTime ? parseFloat(req.body.endTime) : null;
    
    // 生成唯一ID用于此次提取
    const extractionId = uuidv4();
    const outputDir = path.join(framesDir, extractionId);
    fs.ensureDirSync(outputDir);
    
    // 提取帧
    const frames = await extractFrames(videoPath, outputDir, {
      fps,
      quality,
      format,
      startTime,
      endTime
    });
    
    // 如果是临时下载的视频文件，删除它
    if (isTemp) {
      fs.removeSync(videoPath);
    }
    
    res.json({ frames });
  } catch (error) {
    console.error('提取帧时出错:', error);
    res.status(500).json({ message: `提取视频帧失败: ${error.message}` });
  }
});

// 从URL下载视频
async function downloadVideo(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载视频失败: ${response.statusText}`);
    }
    
    const fileName = `${uuidv4()}.mp4`;
    const filePath = path.join(tempDir, fileName);
    
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });
    
    return filePath;
  } catch (error) {
    throw new Error(`下载视频失败: ${error.message}`);
  }
}

// 使用FFmpeg提取视频帧
async function extractFrames(videoPath, outputDir, options) {
  return new Promise((resolve, reject) => {
    const { fps, quality, format, startTime, endTime } = options;
    
    // 创建FFmpeg命令
    let command = ffmpeg(videoPath);
    
    // 应用质量设置
    let outputQuality;
    switch (quality) {
      case 'low':
        outputQuality = format === 'jpg' ? 5 : 3;
        break;
      case 'medium':
        outputQuality = format === 'jpg' ? 80 : 8;
        break;
      case 'high':
      default:
        outputQuality = format === 'jpg' ? 100 : 10;
        break;
    }
    
    // 设置格式特定选项
    let outputOptions = [];
    if (format === 'jpg') {
      outputOptions = ['-q:v', outputQuality];
    } else if (format === 'png') {
      outputOptions = ['-q:v', outputQuality];
    } else if (format === 'webp') {
      outputOptions = ['-q:v', outputQuality];
    }
    
    // 应用时间范围限制
    if (startTime !== null) {
      command = command.seekInput(startTime);
    }
    if (endTime !== null) {
      command = command.duration(endTime - (startTime || 0));
    }
    
    // 如果指定了fps，使用fps过滤器
    if (fps) {
      command = command.outputOptions([
        '-vf', `fps=${fps}`
      ]);
    }
    
    // 添加输出选项
    command = command.outputOptions(outputOptions);
    
    // 设置输出文件名模式
    const outputPattern = `frame-%04d.${format}`;
    const outputPath = path.join(outputDir, outputPattern);
    
    // 执行命令
    command
      .output(outputPath)
      .on('end', function() {
        // 读取生成的帧文件
        fs.readdir(outputDir, (err, files) => {
          if (err) {
            return reject(err);
          }
          
          // 过滤并排序帧文件
          const frameFiles = files
            .filter(file => file.startsWith('frame-') && file.endsWith(`.${format}`))
            .sort((a, b) => {
              const numA = parseInt(a.match(/frame-(\d+)/)[1]);
              const numB = parseInt(b.match(/frame-(\d+)/)[1]);
              return numA - numB;
            });
          
          // 构建帧信息
          const frames = frameFiles.map((file, index) => {
            return {
              url: `/frames/${extractionId}/${file}`,
              index,
              format
            };
          });
          
          resolve(frames);
        });
      })
      .on('error', function(err) {
        reject(err);
      })
      .run();
  });
}

// 定期清理临时文件（24小时后删除）
setInterval(() => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  // 清理上传目录
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime.getTime() < oneDayAgo) {
          fs.unlink(filePath, err => {
            if (err) console.error(`删除过期上传文件失败: ${filePath}`, err);
          });
        }
      });
    });
  });
  
  // 清理临时目录
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime.getTime() < oneDayAgo) {
          fs.unlink(filePath, err => {
            if (err) console.error(`删除临时文件失败: ${filePath}`, err);
          });
        }
      });
    });
  });
  
  // 清理帧目录中的旧文件夹
  fs.readdir(framesDir, (err, folders) => {
    if (err) return;
    
    folders.forEach(folder => {
      const folderPath = path.join(framesDir, folder);
      fs.stat(folderPath, (err, stats) => {
        if (err) return;
        
        if (stats.isDirectory() && stats.mtime.getTime() < oneDayAgo) {
          fs.remove(folderPath, err => {
            if (err) console.error(`删除旧帧文件夹失败: ${folderPath}`, err);
          });
        }
      });
    });
  });
}, 3600000); // 每小时检查一次

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 