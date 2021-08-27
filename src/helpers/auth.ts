import md5 from 'md5'

export const nmsAuthParam = (path: string) => {
  const nmsSecret = process.env.NMS_SECRET
  if (!nmsSecret) return ''

  const timestamp = new Date(new Date().valueOf() + 60 * 60 * 1000)
  const hash = md5(`${path}-${timestamp.valueOf()}-${nmsSecret}`)

  return `?sign=${timestamp}-${hash}`
}