import React from 'react'
import AdminDashboard from './views/dashboard/AdminDashboard'

import DashboardRouter from './views/dashboard/DashboardRouter'

import SchoolListing from './views/Features/SchoolManagement/SchoolListing'
import SubscriptionListing from './views/Features/SubscriptionPlan/SubscriptionPlan'
import AddOnListing from './views/Features/Add-on-Plans/Add-on-Plans'
import SubscriptionHistory from './views/Features/SubscriptionHistory/SubscriptionHistory'
import SchoolDashboard from './views/Features/SchoolManagement/SchoolDetails/schoolDetails'
import AdminSupportList from './views/Features/Help&Support/Help&Support'
import LeadsListing from './views/Features/Leads/LeadsListing'
import BillingReport from './views/Features/Reports/BillingReport'
import SchoolBillingReport from './views/Features/Reports/SchoolBillingReport'
import OverdueReport from './views/Features/Reports/OverdueReport'
import SessionBillingReport from './views/Features/Reports/SessionBillingReport'
import CollectionSummaryReport from './views/Features/Reports/CollectionSummaryReport'
import PlanDistributionReport from './views/Features/Reports/PlanDistributionReport'
import FAQListing from './views/Features/FAQ/FAQListing'
import ContactInquiries from './views/Features/ContactInquiries/ContactInquiries'
import NewsletterSubscribers from './views/Features/Newsletter/NewsletterSubscribers'
import FreeTrialPackages from './views/Features/FreeTrialPackages/FreeTrialPackages'

const routes = [
  {
    path: '/dashboard',
    element: DashboardRouter,
    roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student', 'Parent'],
  },
  {
    path: '/subscription-plans',
    element: SubscriptionListing,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/addon-plans',
    element: AddOnListing,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/free-trial-packages',
    element: FreeTrialPackages,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/subscription-history',
    element: SubscriptionHistory,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/school-management/listing',
    element: SchoolListing,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/school-management/details/:id',
    element: SchoolDashboard,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/leads',
    element: LeadsListing,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/support',
    element: AdminSupportList,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/reports/billing',
    element: BillingReport,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/reports/school',
    element: SchoolBillingReport,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/reports/overdue',
    element: OverdueReport,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/reports/session-billing',
    element: SessionBillingReport,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/reports/collection-summary',
    element: CollectionSummaryReport,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/reports/plan-distribution',
    element: PlanDistributionReport,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/faq',
    element: FAQListing,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/contact-inquiries',
    element: ContactInquiries,
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    path: '/newsletter',
    element: NewsletterSubscribers,
    roles: ['SuperAdmin', 'Admin'],
  },
]

export default routes
