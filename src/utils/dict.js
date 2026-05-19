export const saveDict = (list) => localStorage.setItem('dictData', JSON.stringify(list))
export const getDict = () => JSON.parse(localStorage.getItem('dictData') || '[]')

export const getDictItems = (name) => getDict().find(d => d.dictName === name)?.items || []
export const getDictLabel = (name, val) => getDictItems(name).find(i => String(i.value) === String(val))?.label || ''
export const getDictOptions = (name) => getDictItems(name).map(i => ({ label: i.label, value: i.value }))
