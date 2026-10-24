/* eslint-disable prettier/prettier */
import { useContext } from 'react'
import { AppContext } from '../../Context/AppContext'

import AdminDashboard from './AdminDashboard'


const DashboardRouter = () => {
  const { user } = useContext(AppContext)

  if (!user || !user.role) return null

  switch (user.role) {
    case 'SuperAdmin':
      // return <SuperAdminDashboard />
      return <AdminDashboard /> // agar same dashboard use kar rahe ho

    case 'Admin':
      return <AdminDashboard />

    // case 'Teacher':
    //   return <TeachersDashboard />

    // case 'Student':
    //   return <StudentDashboard />

    // case 'Parent':
    //   return <ParentDashboard />

    default:
      return null
  }
}

export default DashboardRouter
