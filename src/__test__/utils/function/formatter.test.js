const formatLength = function (length) {
  let output
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km'
  } else {
    output = Math.round(length * 100) / 100 + ' ' + 'm'
  }
  return output
}
describe('formatLength function', () => {
  test('should return length in meters if length is less than or equal to 100', () => {
    expect(formatLength(50)).toBe('50 m')
  })

  test('should return length in kilometers if length is greater than 100', () => {
    expect(formatLength(150)).toBe('0.15 km')
  })

  test('should round to two decimal places', () => {
    expect(formatLength(120)).toBe('0.12 km')
    expect(formatLength(99.9999)).toBe('100 m')
  })

  test('should handle zero length', () => {
    expect(formatLength(0)).toBe('0 m')
  })
})
