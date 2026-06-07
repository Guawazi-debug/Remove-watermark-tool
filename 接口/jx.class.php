<?php
//支持主流平台解析算法
//禁止使用本代码用于任何违法违规业务或项目,造成的任何法律后果由使用者（或运营者）承担全部责任。
class jxsuanfa {

///抖音解析1
function getDouyinUrl($url) {
    // 生成随机IP地址
    $generateRandomIP = function () {
        return mt_rand(1, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255);
    };

    // 第一次请求获取重定向地址
   $ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (Linux; Android 8.0; DUK-AL20 Build/HUAWEIDUK-AL20; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044353 Mobile Safari/537.36 MicroMessenger/6.7.3.1360(0x26070333) NetType/WIFI Language/zh_CN Process/tools',
    CURLOPT_HTTPHEADER     => [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'X-Forwarded-For: ' .$this->Rand_IP(),
        'X-Real-IP: ' . $this->Rand_IP(),
    ],
]);
    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    curl_close($ch);

    // 解析Location头
    if (!preg_match('/Location:\s*(.*?)\s*X-Tt-Logid/is', $headers, $matches)) {
        return false;
    }
    $redirectUrl = trim($matches[1]);


    // 第二次请求获取视频页面
    $ch = curl_init($redirectUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (Linux; Android 8.0; DUK-AL20 Build/HUAWEIDUK-AL20; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044353 Mobile Safari/537.36 MicroMessenger/6.7.3.1360(0x26070333) NetType/WIFI Language/zh_CN Process/tools',
        CURLOPT_HTTPHEADER     => [
            'X-Forwarded-For: ' . $this->Rand_IP(),
            'X-Real-IP: ' . $this->Rand_IP()
        ],
    ]);
    $html = curl_exec($ch);
    curl_close($ch);


    $pattern = '/window\._ROUTER_DATA\s*=\s*(.*?)\<\/script>/s';

        preg_match($pattern, $html, $matches);
        //return trim($matches[1]);
       $videoData=json_decode($matches[1],true);

         //获取作品名
       $link = $videoData['loaderData']['video_(id)/page']['videoInfoRes']['item_list'][0]['video']['play_addr']['url_list'][0] ?? "";
         $link = str_replace('playwm', 'play', $link);

         //获取作品名
          $videoItem = $videoData['loaderData']['video_(id)/page']['videoInfoRes']['item_list'][0]['desc'] ?? [];
    $noteItem = $videoData['loaderData']['note_(id)/page']['videoInfoRes']['item_list'][0]['desc'] ?? [];
    //获取封面
        $getimg=$videoData['loaderData']['video_(id)/page']['videoInfoRes']['item_list'][0]['video']['cover']['url_list'][0] ?? "";
       //音乐
      // title.video['play_addr'].uri
      $music = $videoData['loaderData']['note_(id)/page']['videoInfoRes']['item_list'][0]['video']['play_addr']['uri'] ?? [];
       //获取图集
       $list = $videoData['loaderData']['note_(id)/page']['videoInfoRes']['item_list'][0]['images'] ?? [];
        foreach ($list as $val){
            $data[] = $val['url_list'][0];
        }


if (empty($link)) {
    // 如果 $link 没有数据，输出图集
    if (empty($noteItem)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
    $video = [
        "code" => 200,
        "msg" => "解析成功",
        "data" => [
            "title" => $noteItem,
            "music" => $music,
            "images" => $data,
             "type" =>"images",// 输出图集数据
            "author" => "接口维护中！QQ：32992819977"
        ]
    ];
    }
} else {
    // 如果 $link 有数据，判断 $videoItem 是否有数据
    if (empty($videoItem)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
               "title" =>$videoItem,
                "cover" => $getimg,
                "video" => $link,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }
}

    return $video;
    // return $videoData;

}



//抖音解析2

function get_redirected_url($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_exec($ch);
    $redirected_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    return $redirected_url;
}


function getdyshuju($url) {


    $generateRandomIP = function () {
        return mt_rand(1, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255);
    };

    $redirected_url = $this->get_redirected_url($url);
    preg_match('/(\d+)/', $redirected_url, $matches);
    $video_id = $matches[1];

    $headers = [
    'User-Agent: Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    'Referer: https://www.douyin.com/?is_from_mobile_home=1&recommend=1',
    'X-Forwarded-For: ' . $this->Rand_IP(),
            'X-Real-IP: ' . $this->Rand_IP()
];


$url = "https://www.iesdouyin.com/share/video/$video_id/";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
curl_close($ch);


preg_match('/_ROUTER_DATA\s*=\s*(\{.*?\});/', $response, $matches);
$data = $matches[1];

// 解析 JSON 数据
$jsonData = json_decode($data, true);

// 获取视频信息
$itemList = $jsonData['loaderData']['video_(id)/page']['videoInfoRes']['item_list'][0];
$nickname = $itemList['author']['nickname'];
$title = $itemList['desc'];
$awemeId = $itemList['aweme_id'];
$video = $itemList['video']['play_addr']['uri'];
$videoUrl = $video !== null ? (strpos($video, 'mp3') === false ? 'https://www.douyin.com/aweme/v1/play/?video_id=' . $video : $video) : null;
$cover = $itemList['video']['cover']['url_list'][0];
$images = $itemList['images'] ?? null;

foreach ($images as $val){
            $data1[] = $val['url_list'][0];
        }


if (empty($videoUrl)) {
    // 如果 $link 没有数据，输出图集
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
    $video = [
        "code" => 200,
        "msg" => "解析成功",
        "data" => [
            "title" => $title,
            "cover" => $cover,
            "imsges" => $data1,
             "type" =>"images",// 输出图集数据
            "author" => "接口维护中！QQ：32992819977"
        ]
    ];
    }
} else {
    // 如果 $link 有数据，判断 $videoItem 是否有数据
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
               "title" =>$videoItem,
                "cover" => $cover,
                "video" => $videoUrl,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }
}

    return $video;
    // return $videoData;

}





//快手解析视频算法
   function getkssp($redirectUrl) {
       /*
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_HEADER => true,
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        CURLOPT_HTTPHEADER     => [
            'X-Forwarded-For: ' . $this->Rand_IP(),
            'X-Real-IP: ' . $this->Rand_IP()
        ],



    ]);
    $response = curl_exec($ch);
    if (preg_match('/Location: (.*)/i', $response, $matches)) {
          $redirectUrl=trim($matches[1]);
          */
          /*
        $prefix = '/fw/photo/';
        //fw/long-video/
$position = strpos($redirectUrl, $prefix);

    $result = substr($redirectUrl, $position + strlen($prefix));
    */
    $prefix1 = '/fw/photo/';
     $prefix2 = '/fw/long-video/';

// 查找第一个前缀的位置
    $position = strpos($redirectUrl, $prefix1);
    if ($position !== false) {
    $result = substr($redirectUrl, $position + strlen($prefix1));
   } else {
    // 查找第二个前缀的位置
    $position = strpos($redirectUrl, $prefix2);
    if ($position !== false) {
        $result = substr($redirectUrl, $position + strlen($prefix2));
    } else {
        // 两个前缀都不存在时的处理，可根据需要调整
        $result = '';
    }
}

    $url12="https://www.kuaishou.com/short-video/".$result."&utm_source=app_share&utm_medium=app_share&utm_campaign=app_share&location=app_share";
        return trim($url12);
   // }

}
//快手视频suanfa

function getksvideoData($url) {
     $url=$this->getkssp($url);
    $generateRandomIP = function () {
        return mt_rand(1, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255);
    };
$headers = array(
    "sec-ch-ua: \"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "sec-ch-ua-platform: \"Windows\"",
    "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "Upgrade-Insecure-Requests: 1",
    "Sec-Fetch-Site: none",
    "Accept-Encoding: gzip, deflate, br, zstd",
    "Cookie: did=web_81a37c1c67d94e3798fdee50c969c595; didv=1744619086000; kpf=PC_WEB; clientid=3; kpn=KUAISHOU_VISION",
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "Connection: keep-alive",
    "sec-ch-ua-mobile: ?0",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-User: ?1",
    "Sec-Fetch-Dest: document",
    "Host: www.kuaishou.com",
     'X-Forwarded-For: ' . $this->Rand_IP(),
    'X-Real-IP: ' . $this->Rand_IP(),
    'Referer: ' . $url
);

// 初始化cURL会话
$ch = curl_init();


$tmie=time() * 1000;
$cookies="did=web_81a37c1c67d94e3798fdee50c969c595; didv=$tmie; kpf=PC_WEB; clientid=3; kpn=KUAISHOU_VISION";
// 设置cURL选项
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_COOKIE, $cookies);
/*
curl_setopt($ch, CURLOPT_PROXY, '114.247.84.186:80');
curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
/*
curl_setopt_array($ch, [
        CURLOPT_PROXY => '42.63.65.69:80',   // HTTP代理
        CURLOPT_PROXYTYPE => CURLPROXY_HTTP// 启用cookie会话
    ]);
// 执行cURL请求
*/
$encodedData = curl_exec($ch);

curl_close($ch);
$decodedData = gzinflate(substr($encodedData, 10));

// 执行cURL会话

$pattern = '/window\.__APOLLO_STATE__\s*=\s*(\{.*?\});/s';

        preg_match($pattern, $decodedData, $matches);
        //return trim($matches[1]);
       $ht= trim($matches[1]);
       //$videoData=json_decode($matches[1],true);
       $videoData=json_decode($ht,true);

       $path = parse_url($url, PHP_URL_PATH);        // 获取路径部分：/short-video/3xmjpg68kau8byc
      $pathSegments = explode('/', trim($path, '/')); // 分割路径为数组
       $id = $pathSegments[1] ?? '';                // 提取ID：3xmjpg68kau8byc

// 处理数据结构
       $jsonKey = 'VisionVideoDetailPhoto:' . $id;  // 构造完整JSON键名
       $shipinm = $videoData['defaultClient'][$jsonKey]['caption'] ?? "";
       $shipfm=$videoData['defaultClient'][$jsonKey]['coverUrl'] ?? "";
       $shiplj=$videoData['defaultClient'][$jsonKey]['photoUrl'] ?? "";
//defaultClient['VisionVideoDetailPhoto:3xmjpg68kau8byc'].photoUrl


    // 如果 $link 没有数据，输出图集
    if (empty($shipinm)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接12",
            "author" => "接口维护中！QQ：32992819977",
            "title" =>$decodedData,
        ];
    } else {
    $video = [
        "code" => 200,
        "msg" => "解析成功",
        "data" => [
            "title" =>$shipinm,
                "cover" => $shipfm,
                "video" => $shiplj,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
        ]
    ];
    }




       return $video;



}

//快手图文算法
function getkstw($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_HEADER => true,
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        CURLOPT_HTTPHEADER     => [
            'X-Forwarded-For: ' . $this->Rand_IP(),
            'X-Real-IP: ' . $this->Rand_IP()
        ],
    ]);
    $response = curl_exec($ch);
    if (preg_match('/Location: (.*)/i', $response, $matches)) {
          $redirectUrl=trim($matches[1]);
          /*
        $prefix = '/fw/photo/';
        //fw/long-video/
$position = strpos($redirectUrl, $prefix);

    $result = substr($redirectUrl, $position + strlen($prefix));
    $url12="https://www.kuaishou.com/short-video/".$result."&utm_source=app_share&utm_medium=app_share&utm_campaign=app_share&location=app_share";
    */
        return $redirectUrl;
    }

}


  function getImage($url) {
    $generateRandomIP = function () {
        return mt_rand(1, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255);
    };
    //$submitCookie = "kpf=PC_WEB; clientid=3; did=web_873ed980b138af63e7da032fe7b4f8a6; didv=1744271737000; kpn=KUAISHOU_VISION";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url); // 设置目标网址
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // 将curl_exec()获取的信息以文件流的形式返回，而不是直接输出
//curl_setopt($ch, CURLOPT_COOKIE, $submitCookie); // 设置Cookie
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Host: v.m.chenzhongtech.com',
    'Upgrade-Insecure-Requests: 1',
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Sec-Fetch-Site: none',
    'Sec-Fetch-User: ?1',
    'Sec-Fetch-Dest: document',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Sec-Fetch-Mode: navigate',
    'Connection: keep-alive',
    'sec-ch-ua: "Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile: ?0',
    'sec-ch-ua-platform: "Windows"',
    'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Referer: '.$url,
    'X-Forwarded-For: ' . $this->Rand_IP(),
    'X-Real-IP: ' . $this->Rand_IP(),

)); // 设置请求头

// 执行cURL会话
$response = curl_exec($ch);
curl_close($ch);



// 假设 $data 是提供的返回内容


// 提取文字内容
$textPattern = '/"caption":"(.*?)"/';
preg_match($textPattern, $response, $textMatches);
$text = isset($textMatches[1]) ? $textMatches[1] : '';

// 提取图片路径
$imagePattern = '/"list":\[(.*?)\]/';
preg_match($imagePattern, $response, $imageMatches);
$imageList = [];

    // 将匹配到的字符串按逗号分隔并去除空格
    $imageUrls = explode(',', $imageMatches[1]);
    foreach ($imageUrls as $imageUrl) {
        // 去除多余的引号和空格
        $imageUrl = trim($imageUrl, '" ');
        // 拼接完整的图片路径
        $imageList[] = 'https://tx2.a.kwimgs.com' . $imageUrl;

    }

    if (empty($text)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
               "title" =>$text,
                //"cover" => $getimg,
                "images" => $imageList,
                 "type" =>"images",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }
  return $video;


}

//小红书算法解析


   function getxhs($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_HEADER => true,
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        CURLOPT_HTTPHEADER     => [
            'X-Forwarded-For: ' . $this->Rand_IP(),
            'X-Real-IP: ' . $this->Rand_IP()
        ],

    ]);
    $response = curl_exec($ch);
    if (preg_match('/Location: (.*)/i', $response, $matches)) {
          $redirectUrl=trim($matches[1]);

        return $redirectUrl;
    }

}
//小红书shuju
function getxhssj($url) {

    $url=$this->getxhs($url);
    $generateRandomIP = function () {
        return mt_rand(1, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255) . '.' . mt_rand(0, 255);
    };

     $ch = curl_init();
// 执行cURL会话
       $headers = [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
    'Sec-Fetch-Dest: document',
    'sec-ch-ua-platform: "Windows"',
    'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Host: www.xiaohongshu.com',
    'Upgrade-Insecure-Requests: 1',
    'Sec-Fetch-Mode: navigate',
    'sec-ch-ua: "Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile: ?0',
    'Connection: keep-alive',
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Sec-Fetch-Site: none',
    'Sec-Fetch-User: ?1',
    'X-Forwarded-For: ' . $this->Rand_IP(),
    'X-Real-IP: ' .$this->Rand_IP(),
];

curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,    // 返回结果为字符串
    CURLOPT_HEADER => false,           // 不输出响应头
    CURLOPT_HTTPHEADER => $headers,    // 设置请求头
    //CURLOPT_COOKIE => $cookie,         // 设置Cookie
    CURLOPT_SSL_VERIFYPEER => false,   // 禁用SSL证书验证
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_ENCODING => ''             // 自动处理压缩编码
]);

// 执行请求并获取响应
$html = curl_exec($ch);

// 检查错误
if(curl_errno($ch)) {
    die('cURL Error: ' . curl_error($ch));
}

// 关闭cURL资源
curl_close($ch);
//$titlePattern = '/<meta name="og:title" content="([^"]+)"/';

$titlePattern = '/<meta name="description" content="([^"]+)"/';
preg_match($titlePattern, $html, $titleMatches);
// 提取标题
$title = isset($titleMatches[1]) ? $titleMatches[1] : ''; //文案

// 提取图片URL
$dom = new DOMDocument();
@$dom->loadHTML($html); // 忽略 HTML 格式错误

$imageUrls = [];
$metaTags = $dom->getElementsByTagName('meta');

foreach ($metaTags as $tag) {
    if ($tag->getAttribute('name') === 'og:image') {
        $imageUrls[] = $tag->getAttribute('content');
    }
}

    $xpath = new DOMXPath($dom);

// 直接定位目标节点 (XPath 一步到位)
$videoUrl = $xpath->evaluate("string(//meta[@name='og:video']/@content)");
if (empty($videoUrl)) {
    // 如果 $link 没有数据，输出图集
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
    $video = [
        "code" => 200,
        "msg" => "解析成功",
        "data" => [
            "title" => $title,
           // "music" => $music,
            "images" => $imageUrls,
             "type" =>"images",// 输出图集数据
            "author" => "接口维护中！QQ：32992819977"
        ]
    ];
    }
} else {
    // 如果 $link 有数据，判断 $videoItem 是否有数据
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
               "title" =>$title,
               // "cover" => $getimg,
                "video" => $videoUrl,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }
}

    return $video;
}

//快手解析判断
function getksjx($url) {
    //视频


     $url1=$this->getkstw($url);
    $kssj=$this->getImage($url1);
    if($kssj['code']==-1){
     $kszd=$this->getksvideoData($url1);

     if($kszd['code']==-1){
     $ksjh2=$this->juhe2($url);

     if($ksjh2['code']==-1){
     $ks1=$this->ks1($url);
     return $ks1;

    }else{
        return $ksjh2;
    }




    }else{
        return $kszd;
    }


    }else{
        return $kssj;
    }


/*

    //$kssj1=$this->getksvideoData($url1);
     //$kssj1=$this->ks1($url);
     //$kssj1=$this->http_post_request($url);
     $kssj1=$this->juhe2($url);

     return $kssj1;
    }else{
        return $kssj;
    }
    */
 /*
    if($kssj1['code']==-1){
        $kssj2=$this->ks1($url);

    }else{
         return $kssj1;
}


    }else{
        return $kssj;
    }
/*
$kssj1=$this->getksvideoData($url);
    return $kssj1;
   */
}
//随机ip
   function Rand_IP(){
	$ip2id = round(rand(600000, 2550000) / 10000);
	$ip3id = round(rand(600000, 2550000) / 10000);
	$ip4id = round(rand(600000, 2550000) / 10000);
	$arr_1 = array("218","218","66","66","218","218","60","60","202","204","66","66","66","59","61","60","222","221","66","59","60","60","66","218","218","62","63","64","66","66","122","211");
	$randarr= mt_rand(0,count($arr_1)-1);
	$ip1id = $arr_1[$randarr];
	return $ip1id.".".$ip2id.".".$ip3id.".".$ip4id;
}


//频繁备用
function ks1($url1) {
    $url = "https://sv.mznzd.com/video/share/url/parse?url=".$url1;
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,    // 返回结果不直接输出
        CURLOPT_HEADER         => false,    // 不返回响应头
        CURLOPT_SSL_VERIFYPEER => false,    // 跳过SSL验证
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_FOLLOWLOCATION => true,     // 自动跟随重定向
        CURLOPT_MAXREDIRS      => 5         // 最大重定向次数
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    $data=json_decode($response,true);
    if($data['code']==200){
    $title=$data['data']['title'];
    $videoUrl=$data['data']['video_url'];
    $cover=$data['data']['cover_url'];
    $images=$data['data']['images'];
    foreach ($images as $val){
            $data1[] = $val['url_list'][0];
        }


    if (empty($videoUrl)) {
    // 如果 $link 没有数据，输出图集
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
    $video = [
        "code" => 200,
        "msg" => "解析成功",
        "data" => [
            "title" => $title,
            "cover" => $cover,
            "imsges" => $data1,
             "type" =>"images",// 输出图集数据
            "author" => "接口维护中！QQ：32992819977"
        ]
    ];
    }
} else {
    // 如果 $link 有数据，判断 $videoItem 是否有数据
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
               "title" =>$title,
                "cover" => $cover,
                "video" => $videoUrl,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }
}


}else{
    $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];

}
 return $video;


}
//频繁备用2
function http_post_request($url1) {
    $url = "https://tools.zzwws.cn/short_video/api.php";
    $time=time();
    $postData = "parse=".$url1."&time=".$time;
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_POST           => true,          // 启用POST请求
        CURLOPT_POSTFIELDS     => $postData,     // 提交数据
        CURLOPT_HTTPHEADER     => $headers,      // 设置请求头
        CURLOPT_RETURNTRANSFER => true,          // 返回结果不直接输出
        CURLOPT_SSL_VERIFYPEER => false,         // 跳过SSL验证
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 10             // 添加超时设置
    ]);

    $response = curl_exec($ch);

    curl_close($ch);
    $data=json_decode($response,true);
    // $title=$data['data']['title'];
    $videoUrl=$data['data']['video'];
    $cover=$data['data']['cover'];

    if ($data['code']!=0) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
              // "title" =>$videoItem,
                "cover" => $cover,
                "video" => $videoUrl,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }

    return  $video;
}

//聚合备份1


//聚合备份2
function juhe2($url1) {
    $url = "https://api.kxzjoker.cn/api/jiexi_video_2?url=".$url1;
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,    // 返回结果不直接输出
        CURLOPT_HEADER         => false,    // 不返回响应头
        CURLOPT_SSL_VERIFYPEER => false,    // 跳过SSL验证
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_FOLLOWLOCATION => true,     // 自动跟随重定向
        CURLOPT_MAXREDIRS      => 5         // 最大重定向次数
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    $data=json_decode($response,true);
    if($data['success']==true){
    $title=$data['data']['video_title'];
    $videoUrl=$data['data']['video_url'];
    $cover=$data['data']['image_url'];
    if($videoUrl==""){
    $images=$data['data'];
    foreach ($images as $val){
            $data1[] = $val['images'][0];
        }

    }
    if (empty($videoUrl)) {
    // 如果 $link 没有数据，输出图集
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
    $video = [
        "code" => 200,
        "msg" => "解析成功",
        "data" => [
            "title" => $title,
            "cover" => $cover,
            "imsges" => $data1,
            "type" =>"images",// 输出图集数据
            "author" => "接口维护中！QQ：32992819977"
        ]
    ];
    }
} else {
    // 如果 $link 有数据，判断 $videoItem 是否有数据
    if (empty($title)) {
        $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];
    } else {
        $video = [
            "code" => 200,
            "msg" => "解析成功",
            "data" => [
               "title" =>$title,
                "cover" => $cover,
                "video" => $videoUrl,
                "type" =>"video",
                "author" => "接口维护中！QQ：32992819977"
            ]
        ];
    }
}


}else{
    $video = [
            "code" => -1,
            "msg" => "解析失败，请检测链接",
            "author" => "接口维护中！QQ：32992819977"
        ];

}
 return $video;


}




}
