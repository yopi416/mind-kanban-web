import { Outlet, useParams } from 'react-router'

export const TestSomething2 = () => {
  const params = useParams()
  console.log(params)
  const filePath = params['*']

  return (
    <>
      <h2>This is TestSomething2!!</h2>
      <p>file path = {filePath}</p>
      <Outlet />
    </>
  )
}
