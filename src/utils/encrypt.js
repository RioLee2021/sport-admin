import md5 from 'blueimp-md5'

/**
 * 单次 MD5 加密
 * @param {string} str 原始字符串
 * @returns {string} 32位小写 MD5
 */
export const encryptPassword = (str) => {
  return md5(str).toLowerCase()
}

/**
 * 密码强度校验（可选）
 */
export const isValidPassword = (pwd) => {
  return pwd && pwd.length >= 6 && pwd.length <= 20
}
