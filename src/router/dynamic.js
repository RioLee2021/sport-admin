import router from './index'
import Layout from '@/layout/index.vue'

// 🔥 关键：glob 返回的是物理路径 /src/views/xxx，不是 @/views/xxx
const viewsModules = import.meta.glob('/src/views/**/index.vue', { eager: false })

// 🔍 调试：打印所有匹配的 key（仅开发环境）
if (import.meta.env.DEV) {
  console.group('📦 [DEBUG] import.meta.glob 匹配结果')
  console.log('🔑 所有匹配的组件路径:')
  Object.keys(viewsModules).forEach(key => console.log('  •', key))
  console.log('🎯 目标组件 /src/views/merchant/index.vue:',
    '/src/views/merchant/index.vue' in viewsModules ? '✅ 存在' : '❌ 不存在')
  console.groupEnd()
}

let addedRoutes = []

let _routesGenerated = false  // ✅ 全局锁

export function generateRoutes(menuTree) {
  if (_routesGenerated) return  // ✅ 已生成则跳过
  _routesGenerated = true       // ✅ 上锁
  console.log('🔧 generateRoutes 被调用，菜单数:', menuTree?.length)

  addedRoutes = transformMenu(menuTree)
  console.log('📦 生成的路由配置:', addedRoutes)

  addedRoutes.forEach(route => {
    if (route.name) {
      if (router.hasRoute(route.name)) {
        console.warn(`⚠️ 路由 "${route.name}" 已存在，跳过添加`)
      } else {
        router.addRoute(route)
        console.log(`✅ 路由添加成功: ${route.path} (name: ${route.name})`)
      }
    }
  })

  console.log('🎯 当前所有路由:', router.getRoutes().map(r => r.path))
}

export function resetRoutes() {
  _routesGenerated = false  // 登出时重置
  /*addedRoutes.forEach(route => {
    if (route.name && router.hasRoute(route.name)) {
      router.removeRoute(route.name)
      console.log(`🗑️ 移除路由: ${route.name}`)
    }
  })
  addedRoutes = []*/
}

function generateRouteName(menuPath) {
  return menuPath
    .replace(/^\/+/, '')
    .replace(/\//g, '_')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .toLowerCase()
}

function transformMenu(menus, parentPath = '') {
  return menus.map(m => {
    const path = m.menuPath.startsWith('/') ? m.menuPath : `${parentPath}/${m.menuPath}`
    const isLeaf = !m.children?.length
    const routeName = generateRouteName(m.menuPath)

    console.log(`  🔄 处理菜单: ${m.menuName} (${m.menuPath}) → name: ${routeName}, isLeaf: ${isLeaf}`)

    if (isLeaf) {
      // 🔥 关键修复：使用物理路径 /src/views/xxx 而不是 @/views/xxx
      const viewPath = m.menuPath.replace(/^\/+/, '')
      const globKey = `/src/views/${viewPath}/index.vue`  // ✅ 改为物理路径
      const hasComponent = globKey in viewsModules

      console.log(`    ✅ 叶子节点: globKey=${globKey}, 组件存在=${hasComponent}`)

      return {
        path,
        name: routeName,
        component: viewsModules[globKey] || (() => import('@/views/welcome/index.vue')),
        meta: {
          title: m.menuName,
          icon: m.icon || 'Menu',
          menuId: m.id
        }
      }
    } else {
      const route = {
        path,
        name: routeName,
        component: Layout,
        meta: {
          title: m.menuName,
          icon: m.icon || 'Menu',
          menuId: m.id
        },
        children: transformMenu(m.children, path)
      }

      if (route.children.length > 0) {
        route.redirect = route.children[0].path
        console.log(`    📁 父菜单: 重定向到 ${route.redirect}`)
      }

      return route
    }
  })
}
