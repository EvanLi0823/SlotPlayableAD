// 横竖屏适配系统 - 枚举修复说明
//
// 问题原因：
// TypeScript 编译时，枚举值可能在某些情况下无法正确初始化，
// 导致 "Cannot read properties of null" 错误。
//
// 解决方案：
// 将所有枚举值的使用改为字符串字面量，避免编译时的依赖问题。
//
// 修改内容：
// 1. DeviceOrientation 枚举值：
//    - DeviceOrientation.Landscape → 'landscape'
//    - DeviceOrientation.Portrait → 'portrait'
//    - DeviceOrientation.Unknown → 'unknown'
//
// 2. ScreenSize 枚举值：
//    - ScreenSize.Phone → 'phone'
//    - ScreenSize.Tablet → 'tablet'
//    - ScreenSize.Desktop → 'desktop'
//
// 3. LayoutTemplate 枚举值：
//    - LayoutTemplate.ThreeColumn → 'three-column'
//    - LayoutTemplate.SingleColumn → 'single-column'
//    - LayoutTemplate.TwoColumn → 'two-column'
//
// 4. AdaptationEvent 枚举值：
//    - AdaptationEvent.OrientationChanged → 'orientation-changed'
//    - AdaptationEvent.AdaptationStart → 'adaptation-start'
//    - AdaptationEvent.AdaptationComplete → 'adaptation-complete'
//    - AdaptationEvent.SafeAreaUpdated → 'safe-area-updated'
//    - AdaptationEvent.ScreenSizeChanged → 'screen-size-changed'
//
// 测试命令（在浏览器控制台）：
// adaptationManager.getCurrentOrientation() // 返回当前方向
// adaptationManager.setOrientation('portrait') // 切换到竖屏
// adaptationManager.setOrientation('landscape') // 切换到横屏
// adaptationManager.refresh() // 刷新布局