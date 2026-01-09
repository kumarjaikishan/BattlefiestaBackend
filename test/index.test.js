const { add } = require("../controller/test_controller")

test('toBe', () => {
  expect(add(1, 2)).toBe(3)
})

test('toEqual', () => {
  expect(add(1, 2)).toEqual(3)
})

test('toBeDefined', () => {
  expect(add(1, 2)).toBeDefined()
})

test('toBeNull', () => {
  const value = null
  expect(value).toBeNull()
})

test('toBeGreaterThan', () => {
  expect(add(5, 5)).toBeGreaterThan(5)
})

test('toBeLessThan', () => {
  expect(add(2, 2)).toBeLessThan(10)
})
