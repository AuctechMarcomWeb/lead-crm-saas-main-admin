/* eslint-disable prettier/prettier */
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useCookie from '../../../Hooks/cookie'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { AppContext } from '../../../Context/AppContext'
import { postRequest } from '../../../Helpers'

import logo from '../../../assets/auctech-logo.png'
import loginImg from '../../../assets/logins.jpg'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { setUser } = useContext(AppContext)
  const { setCookie } = useCookie()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({
      ...p,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    setLoading(true)

    postRequest({
      url: 'mainUser/login',
      cred: formData,
    })
      .then((res) => {
        setLoading(false)

        setCookie('multitenant', res?.data?.data?.token, 30)

        localStorage.setItem(
          'userId',
          JSON.stringify(res?.data?.data?.user),
        )

        setUser(res?.data?.data?.user)

        toast.success(res?.data?.message || 'Login Successful')

        navigate('/')
      })
      .catch((err) => {
        setLoading(false)

        toast.error(
          err?.response?.data?.message || 'Login failed',
        )
      })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#00007B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <img
          src={loginImg}
          alt="Login"
          style={{
            width: '75%',
            maxWidth: '500px',
          }}
        />
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          background: '#f5f6f8',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          position: 'relative',
        }}
      >
        {/* TOP LOGO */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 40,
          }}
        >
          <img
            src={logo}
            alt="logo"
            style={{
              height: '45px',
            }}
          />
        </div>

        {/* LOGIN CARD */}
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#fff',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              color: '#006aa3',
              marginBottom: '8px',
            }}
          >
            Login
          </h2>

          <p
            style={{
              color: '#666',
              marginBottom: '25px',
            }}
          >
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit}>
            {/* USER ID */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                User ID
              </label>

              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                placeholder="Enter User ID"
                required
                style={{
                  width: '100%',
                  height: '45px',
                  border: '1px solid #dcdcdc',
                  borderRadius: '6px',
                  padding: '0 15px',
                  outline: 'none',
                }}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: '25px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                Password
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter Password"
                  required
                  style={{
                    width: '100%',
                    height: '45px',
                    border: '1px solid #dcdcdc',
                    borderRadius: '6px',
                    padding: '0 45px 0 15px',
                    outline: 'none',
                  }}
                />

                <span
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666',
                  }}
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </span>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '45px',
                border: 'none',
                borderRadius: '6px',
                background: '#006aa3',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login