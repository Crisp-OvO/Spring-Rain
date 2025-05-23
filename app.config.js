export default {
  name: "数学解题助手",
  slug: "math-solver",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  plugins: [
    "expo-camera",
    "expo-image-picker",
    "expo-file-system",
    "expo-sharing"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.mathsolver"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    },
    package: "com.yourcompany.mathsolver",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // API密钥和配置
    huggingFaceApiKey: "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",
    mongodbConnectionString: "mongodb+srv://lzh3937253:lizhuo1152710511@chris.tuqq5.mongodb.net/",
    
    // API端点
    apiUrl: "http://192.168.31.160:3000",
    huggingFaceOcrModelUrl: "https://api.huggingface.co/models/microsoft/trocr-base-handwritten",
    
    // 数据库配置
    mongodbDbName: "math_solver",
    
    // 应用时间戳，用于缓存失效
    buildTimestamp: Date.now()
  }
}; 