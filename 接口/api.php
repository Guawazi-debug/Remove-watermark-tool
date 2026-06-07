<?php
// Video proxy
if (isset($_GET['proxy'])) {
    $videoUrl = urldecode($_GET['proxy']);

    $ch = curl_init($videoUrl);
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept: */*',
        'Accept-Encoding: identity',
        'Referer: https://www.douyin.com/',
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($response && $httpCode == 200) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: ' . ($contentType ?: 'video/mp4'));
        header('Content-Length: ' . strlen($response));

        if (isset($_GET['download'])) {
            header('Content-Disposition: attachment; filename="video.mp4"');
        }

        echo $response;
    } else {
        http_response_code(500);
    }
    exit;
}

// API parse logic
header('Content-type: application/json');

$url = $_REQUEST['url'] ?? '';
if (empty($url)) {
    echo json_encode(["code" => -1, "msg" => "请输入链接"]);
    exit;
}

$url = urldecode($url);

// B站解析
if (strpos($url, 'bilibili.com') !== false || strpos($url, 'b23.tv') !== false || preg_match('/BV[a-zA-Z0-9]+/', $url)) {
    $config = [
        'ffmpeg_path' => '/usr/bin/ffmpeg',
        'cache_dir'   => '/www/wwwroot/qsy/cache/',
        'cache_time'  => 3600,
        'base_url'    => 'https://qsy.awenz.cn/cache/',
    ];

    try {
        // 创建缓存目录
        if (!is_dir($config['cache_dir'])) {
            mkdir($config['cache_dir'], 0755, true);
        }

        // 解析短链接
        if (strpos($url, 'b23.tv') !== false) {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_NOBODY => true,
            ]);
            curl_exec($ch);
            $url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            curl_close($ch);
        }

        // 提取BV号
        if (!preg_match('/BV[a-zA-Z0-9]+/', $url, $matches)) {
            throw new Exception("无法提取BV号");
        }
        $bvid = $matches[0];

        // 获取视频信息
        $ch = curl_init("https://api.bilibili.com/x/web-interface/view?bvid={$bvid}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer: https://www.bilibili.com/',
            ],
        ]);
        $videoInfo = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if ($videoInfo['code'] !== 0) {
            throw new Exception("获取视频信息失败");
        }

        $cid = $videoInfo['data']['pages'][0]['cid'];
        $title = $videoInfo['data']['title'];
        $cover = $videoInfo['data']['pic'];

        // 生成随机文件名
        $randomName = md5(uniqid(mt_rand(), true)) . '.mp4';
        $cacheFile = $config['cache_dir'] . $randomName;

        // 获取播放地址 (未登录最高720P)
        $ch = curl_init("https://api.bilibili.com/x/player/playurl?bvid={$bvid}&cid={$cid}&qn=64&fnval=16");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer: https://www.bilibili.com/',
            ],
        ]);
        $playData = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if ($playData['code'] !== 0) {
            throw new Exception("获取播放地址失败");
        }

        $videoUrl = $playData['data']['dash']['video'][0]['baseUrl'] ?? null;
        $audioUrl = $playData['data']['dash']['audio'][0]['baseUrl'] ?? null;

        if (!$videoUrl || !$audioUrl) {
            throw new Exception("获取直链失败");
        }

        // 下载视频和音频
        $tempVideo = $config['cache_dir'] . $bvid . '_video.m4s';
        $tempAudio = $config['cache_dir'] . $bvid . '_audio.m4s';

        // 下载视频
        $fp = fopen($tempVideo, 'w');
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $videoUrl,
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer: https://www.bilibili.com/',
            ],
        ]);
        curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        // 下载音频
        $fp = fopen($tempAudio, 'w');
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $audioUrl,
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer: https://www.bilibili.com/',
            ],
        ]);
        curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        // 使用ffmpeg合并
        $cmd = sprintf(
            '%s -i %s -i %s -c copy %s -y 2>&1',
            escapeshellarg($config['ffmpeg_path']),
            escapeshellarg($tempVideo),
            escapeshellarg($tempAudio),
            escapeshellarg($cacheFile)
        );

        exec($cmd, $output, $returnCode);

        // 清理临时文件
        @unlink($tempVideo);
        @unlink($tempAudio);

        if ($returnCode !== 0 || !file_exists($cacheFile)) {
            throw new Exception("视频合成失败");
        }

        echo json_encode([
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
                "title" => $title,
                "cover" => $cover,
                "video" => $config['base_url'] . $randomName,
                "type" => "video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        echo json_encode([
            "code" => -1,
            "msg" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// 其他平台解析
require 'jx.class.php';
$api = new jxsuanfa;

if (strpos($url, 'douyin')) {
    if (strpos($url, 'https://') === false) $url = 'https://' . $url;
    $arr = $api->getDouyinUrl($url);
} elseif (strpos($url, 'kuaishou')) {
    if (strpos($url, 'https://') === false) $url = 'https://' . $url;
    $arr = $api->getksjx($url);
} elseif (strpos($url, 'xhslink')) {
    if (strpos($url, 'http://') === false) $url = 'http://' . $url;
    $arr = $api->getxhssj($url);
} else {
    $arr = $api->juhe2($url);
}

echo json_encode($arr, JSON_UNESCAPED_UNICODE);
