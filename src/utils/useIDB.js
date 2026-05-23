/**
 * IndexedDB 存储工具
 * 提供对 JSON 数据的增删改查操作
 */

const DB_NAME = 'wenyanshiyi_db'
const DB_VERSION = 1

let dbInstance = null

/**
 * 初始化 IndexedDB 数据库
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<IDBDatabase>} 数据库实例
 */
function initDB(storeName) {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      if (!dbInstance.objectStoreNames.contains(storeName)) {
        dbInstance.close()
        dbInstance = null
      } else {
        return resolve(dbInstance)
      }
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

/**
 * 添加数据到指定存储
 * @param {string} storeName - 对象存储名称
 * @param {Object|Array} data - 要添加的数据（单个对象或数组）
 * @returns {Promise<number|number[]>} 添加数据的 ID
 */
export async function addData(storeName, data) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    if (Array.isArray(data)) {
      const ids = []
      let completed = 0
      data.forEach(item => {
        const request = store.add(item)
        request.onsuccess = () => {
          ids.push(request.result)
          completed++
          if (completed === data.length) resolve(ids)
        }
        request.onerror = () => reject(request.error)
      })
    } else {
      const request = store.add(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }
  })
}

/**
 * 根据 ID 获取数据
 * @param {string} storeName - 对象存储名称
 * @param {number} id - 数据 ID
 * @returns {Promise<Object|null>} 查询到的数据
 */
export async function getData(storeName, id) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取指定存储中的所有数据
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<Array>} 所有数据数组
 */
export async function getAllData(storeName) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 更新数据
 * @param {string} storeName - 对象存储名称
 * @param {Object} data - 要更新的数据（必须包含 id 字段）
 * @returns {Promise<number>} 更新数据的 ID
 */
export async function updateData(storeName, data) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 根据 ID 删除数据
 * @param {string} storeName - 对象存储名称
 * @param {number} id - 要删除的数据 ID
 * @returns {Promise<void>}
 */
export async function deleteData(storeName, id) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清空指定存储中的所有数据
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 根据条件查询数据
 * @param {string} storeName - 对象存储名称
 * @param {Function} predicate - 过滤函数，返回 true 表示匹配
 * @returns {Promise<Array>} 匹配的数据数组
 */
export async function queryData(storeName, predicate) {
  const allData = await getAllData(storeName)
  return allData.filter(predicate)
}

/**
 * 批量更新数据
 * @param {string} storeName - 对象存储名称
 * @param {Array} dataList - 要更新的数据数组
 * @returns {Promise<number[]>} 更新数据的 ID 数组
 */
export async function batchUpdate(storeName, dataList) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const ids = []
    let completed = 0

    dataList.forEach(item => {
      const request = store.put(item)
      request.onsuccess = () => {
        ids.push(request.result)
        completed++
        if (completed === dataList.length) resolve(ids)
      }
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 批量删除数据
 * @param {string} storeName - 对象存储名称
 * @param {number[]} ids - 要删除的数据 ID 数组
 * @returns {Promise<void>}
 */
export async function batchDelete(storeName, ids) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    let completed = 0

    ids.forEach(id => {
      const request = store.delete(id)
      request.onsuccess = () => {
        completed++
        if (completed === ids.length) resolve()
      }
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 获取存储中的数据总数
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<number>} 数据总数
 */
export async function countData(storeName) {
  const db = await initDB(storeName)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 创建新的对象存储
 * @param {string} storeName - 要创建的存储名称
 * @param {string} keyPath - 主键字段名，默认为 'id'
 * @returns {Promise<void>}
 */
export async function createStore(storeName, keyPath = 'id') {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close()
      dbInstance = null
    }

    const newVersion = DB_VERSION + 1
    const request = indexedDB.open(DB_NAME, newVersion)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath, autoIncrement: true })
      }
    }
  })
}

/**
 * 删除对象存储
 * @param {string} storeName - 要删除的存储名称
 * @returns {Promise<void>}
 */
export async function deleteStore(storeName) {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close()
      dbInstance = null
    }

    const newVersion = DB_VERSION + 1
    const request = indexedDB.open(DB_NAME, newVersion)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (db.objectStoreNames.contains(storeName)) {
        db.deleteObjectStore(storeName)
      }
    }
  })
}

/**
 * 检查对象存储是否存在
 * @param {string} storeName - 存储名称
 * @returns {Promise<boolean>} 是否存在
 */
export async function hasStore(storeName) {
  const db = await initDB(storeName)
  return db.objectStoreNames.contains(storeName)
}
