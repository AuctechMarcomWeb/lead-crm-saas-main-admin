/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from 'react'

import {
    Search,
    Eye,
    Ticket,
    Edit,
    Trash2,
} from 'lucide-react'

import { Empty, Pagination, Tooltip } from 'antd'

import dayjs from 'dayjs'

import toast from 'react-hot-toast'
import { deleteRequest, getRequest } from '../../../Helpers'
import ViewSupportModal from './ViewSupportModal'
import EditSupportModal from './EditSupportModal'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'




const AdminSupportList = () => {

    // ==========================================
    // STATES
    // ==========================================

    const [supports, setSupports] = useState([])

    const [loading, setLoading] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')

    const [page, setPage] = useState(1)

    const [limit, setLimit] = useState(10)

    const [total, setTotal] = useState(0)

    const [status, setStatus] = useState('')

    const [updateStatus, setUpdateStatus] = useState(false)

    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const [selectedItem, setSelectedItem] = useState(null)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [tempFromDate, setTempFromDate] = useState('')
    const [tempToDate, setTempToDate] = useState('')
    const [showViewModal, setShowViewModal] = useState(false)
    const [schoolId, setSchoolId] = useState('')
    const [role, setRole] = useState('')
    const [showEditModal, setShowEditModal] = useState(false)
    const [schools, setSchools] = useState([])
    // ==========================================
    // TABLE COLUMNS
    // ==========================================

    const ALL_COLUMNS = [
        {
    key: 'ticketNo',
    label: 'Issue No.',
    width: 150,
},
        {
            key: 'title',
            label: 'Title',
            width: 220,
        },

        {
            key: 'description',
            label: 'Description',
            width: 300,
        },

        {
            key: 'schoolName',
            label: 'School',
            width: 200,
        },

        {
            key: 'route',
            label: 'Page Name',
            width: 220,
        },
        {
            key: 'status',
            label: 'Status',
            width: 120,
        },
        {
            key: 'adminReply',
            label: 'Admin Reply',
            width: 220,
        },
        {
            key: "attachment",
            label: "Attachment",
            width: 120,
        },

        {
            key: 'createdAt',
            label: 'Created At',
            width: 150,
        },
    ]

    // ==========================================
    // FETCH SUPPORTS
    // ==========================================
    const fetchSchools = async () => {

        try {

            const res = await getRequest(
                "tenant?page=1&limit=100&isPagination=false"
            )

            setSchools(
                res?.data?.data?.tenants || []
            )

        } catch (error) {

            console.log(error)
        }
    }
    useEffect(() => {

        fetchSchools()

    }, [])

    useEffect(() => {

        fetchSupports()

    }, [page, limit, updateStatus, searchTerm])

    // ==========================================
    // FETCH FUNCTION
    // ==========================================

    const fetchSupports = async () => {

        try {

            setLoading(true)

            const queryParams = {
                page,
                limit,
                search: searchTerm,
            }

            if (status) {
                queryParams.status = status
            }
            if (schoolId) {
                queryParams.schoolId = schoolId
            }

            if (role) {
                queryParams.role = role
            }

            if (fromDate) {
                queryParams.fromDate = fromDate
            }

            if (toDate) {
                queryParams.toDate = toDate
            }

            if (status) {
                queryParams.status = status
            }

            const query =
                new URLSearchParams(queryParams).toString()

            const res = await getRequest(
                `support/all?${query}`
            )

            const responseData = res?.data?.data

            const formattedSupports =
                (responseData?.supports || []).map((item) => ({
                    ...item,

                    schoolName:
                        item?.schoolId?.schoolName || '-',

                    createdAt:
                        dayjs(item.createdAt)
                            .format('DD-MM-YYYY'),
                }))

            setSupports(formattedSupports)

            setTotal(responseData?.totalSupports || 0)

        } catch (error) {

            console.log(error)

            toast.error("Failed to fetch supports")

        } finally {

            setLoading(false)
        }
    }

    // ==========================================
    // DELETE SUPPORT
    // ==========================================

    const handleDelete = async () => {

        try {

            await deleteRequest(
                `support/delete/${selectedItem?._id}`
            )

            toast.success("Support deleted successfully")

            setUpdateStatus((prev) => !prev)

        } catch (error) {

            console.log(error)

            toast.error("Delete failed")

        } finally {

            setShowDeleteModal(false)

            setSelectedItem(null)
        }
    }

    return (
        <div className="min-h-screen">

            {/* ── Header ── */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Ticket size={20} className="text-[#e24028]" />
                        Support Tickets
                    </h1>
                    <p className="text-sm text-gray-500">Manage all support tickets</p>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-end gap-3">

                    {/* SEARCH */}

                    <div className="w-full sm:w-[300px]">

                        <label className="block text-xs font-medium mb-1 tracking-wide">
                            SEARCH
                        </label>

                        <div className="relative">

                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
                            />

                            <input
                                type="text"
                                placeholder="Search title or description..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(1)
                                }}
                                className="
                    pl-9 pr-4 py-2 w-full border rounded-lg text-sm
                    focus:ring-2 focus:ring-blue-200 focus:outline-none
                "
                            />

                        </div>

                    </div>

                    {/* STATUS */}

                    <div className="w-full sm:w-[180px]">

                        <label className="block text-xs font-medium mb-1 tracking-wide">
                            STATUS
                        </label>

                        <select
                            className="
                border rounded-lg px-3 py-2 text-sm w-full
                focus:ring-2 focus:ring-blue-200 focus:outline-none
            "
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value)
                            }}
                        >

                            <option value="">
                                All Status
                            </option>

                            <option value="OPEN">
                                OPEN
                            </option>

                            <option value="IN_PROGRESS">
                                IN_PROGRESS
                            </option>

                            <option value="RESOLVED">
                                RESOLVED
                            </option>

                            <option value="CLOSED">
                                CLOSED
                            </option>

                        </select>

                    </div>

                    {/* SCHOOL */}

                    <div className="w-full sm:w-[220px]">

                        <label className="block text-xs font-medium mb-1 tracking-wide">
                            SCHOOL
                        </label>

                        <select
                            value={schoolId}
                            onChange={(e) => {
                                setSchoolId(e.target.value)
                            }}
                            className="
                border rounded-lg px-3 py-2 text-sm w-full
                focus:ring-2 focus:ring-blue-200 focus:outline-none
            "
                        >

                            <option value="">
                                All Schools
                            </option>

                            {
                                schools.map((school) => (

                                    <option
                                        key={school._id}
                                        value={school._id}
                                    >
                                        {school.schoolName}
                                    </option>

                                ))
                            }

                        </select>

                    </div>

                    {/* ROLE */}

                    <div className="w-full sm:w-[180px]">

                        <label className="block text-xs font-medium mb-1 tracking-wide">
                            ROLE
                        </label>

                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value)
                            }}
                            className="
                border rounded-lg px-3 py-2 text-sm w-full
                focus:ring-2 focus:ring-blue-200 focus:outline-none
            "
                        >

                            <option value="">
                                All Roles
                            </option>

                            <option value="Teacher">
                                Teacher
                            </option>

                            <option value="User">
                                Student
                            </option>

                            <option value="Admin">
                                Admin
                            </option>

                            <option value="SuperAdmin">
                                SuperAdmin
                            </option>

                        </select>

                    </div>

                    {/* FROM DATE */}

                    <div className="w-full sm:w-[180px]">

                        <label className="block text-xs font-medium mb-1 tracking-wide">
                            FROM DATE
                        </label>

                        <input
                            type="date"
                            value={tempFromDate}
                            onChange={(e) => {
                                setTempFromDate(e.target.value)
                            }}
                            className="
                border rounded-lg px-3 py-2 text-sm w-full
                focus:ring-2 focus:ring-blue-200 focus:outline-none
            "
                        />

                    </div>

                    {/* TO DATE */}

                    <div className="w-full sm:w-[180px]">

                        <label className="block text-xs font-medium mb-1 tracking-wide">
                            TO DATE
                        </label>

                        <input
                            type="date"
                            value={tempToDate}
                            onChange={(e) => {
                                setTempToDate(e.target.value)
                            }}
                            className="
                border rounded-lg px-3 py-2 text-sm w-full
                focus:ring-2 focus:ring-blue-200 focus:outline-none
            "
                        />

                    </div>

                    {/* BUTTONS */}

                    <div className="flex gap-2 w-full sm:w-auto">

                        <button
                            onClick={() => {

                                setFromDate(tempFromDate)

                                setToDate(tempToDate)

                                setPage(1)

                                setUpdateStatus(prev => !prev)
                            }}
                            className="flex-1 sm:flex-none px-5 py-2 bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg text-sm transition"
                        >
                            Apply
                        </button>

                        <button
                            onClick={() => {

                                setSearchTerm('')

                                setStatus('')

                                setSchoolId('')

                                setRole('')

                                setFromDate('')

                                setToDate('')

                                setTempFromDate('')

                                setTempToDate('')

                                setPage(1)

                                setUpdateStatus(prev => !prev)
                            }}
                            className="flex-1 sm:flex-none px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                        >
                            Clear
                        </button>

                    </div>

                </div>

            </div>

            {/* ── Table ── */}
            <div className="relative bg-white border border-gray-200 rounded-lg overflow-x-auto min-h-[200px]">

                {/* LOADER */}
                {loading && (
                    <div className="absolute inset-0 z-30 bg-white/70 flex flex-col items-center justify-center">
                        <Loader />
                        <p className="text-sm text-gray-400 mt-2">Loading Support List...</p>
                    </div>
                )}

                <div className="relative overflow-x-auto">
                <table className="min-w-max border-collapse w-full table-fixed">

                    {/* ======================================
              TABLE HEAD
          ====================================== */}

                    <thead className="bg-gray-200 text-gray-700">
                        <tr>

                            <th
                                className="sticky left-0 z-20 bg-gray-200 px-3 py-2 text-sm text-center"
                                style={{ width: 80 }}
                            >
                                Sr. No.
                            </th>

                            {
                                ALL_COLUMNS.map((col) => (
                                    <th
                                        key={col.key}
                                        className="px-3 py-2 text-sm text-center"
                                        style={{
                                            width: col.width,
                                            minWidth: col.width,
                                            maxWidth: col.width,
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))
                            }

                            <th
                                className="sticky right-0 z-20 bg-gray-200 px-5 py-2 text-sm text-center"
                                style={{ minWidth: 120 }}
                            >
                                Actions
                            </th>

                        </tr>
                    </thead>

                    {/* ======================================
              TABLE BODY
          ====================================== */}
                    <tbody>

                        {
                            !loading && supports.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={ALL_COLUMNS.length + 1}
                                    >

                                        <div className="flex items-center justify-center py-10 text-gray-500">

                                            <div>

                                                No Support Record Found

                                                <Empty />

                                            </div>

                                        </div>

                                    </td>

                                </tr>

                            ) : (

                                supports.map((item, rowIndex) => (

                                    <tr
                                        key={item._id}
                                        className=" hover:bg-gray-50"
                                    >

                                        {/* SR NO */}

                                        <td
                                            className="sticky left-0 z-10 bg-white px-3 py-2 text-sm text-center whitespace-nowrap"
                                            style={{
                                                width: 80,
                                                minWidth: 80,
                                                maxWidth: 80,
                                            }}
                                        >

                                            {(page - 1) * limit + rowIndex + 1}

                                        </td>

                                        {/* DYNAMIC CELLS */}
                                        {
                                            ALL_COLUMNS.map((col) => (

                                                <td
                                                    key={col.key}
                                                    className="px-3 py-2 text-sm text-center bg-white"
                                                    style={{
                                                        width: col.width,
                                                        minWidth: col.width,
                                                        maxWidth: col.width,
                                                    }}
                                                >

                                                    {
                                                        col.key === "attachment" ? (

                                                            item?.attachment ? (

                                                                <a
                                                                    href={item?.attachment}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <img
                                                                        src={item?.attachment}
                                                                        alt="attachment"
                                                                        className="
            w-12
            h-12
            object-cover
            rounded-lg
            border
            cursor-pointer
            mx-auto
          "
                                                                    />
                                                                </a>

                                                            ) : "-"

                                                        ) : col.key === "status" ? (

                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-semibold
              ${item.status === "OPEN"
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : item.status === "RESOLVED"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : item.status === "CLOSED"
                                                                                ? "bg-red-100 text-red-700"
                                                                                : "bg-blue-100 text-blue-700"
                                                                    }
            `}
                                                            >
                                                                {item[col.key]}
                                                            </span>

                                                        ) : (

                                                            <Tooltip title={item[col.key]}>
                                                                <div className="truncate">
                                                                    {item[col.key] || "-"}
                                                                </div>
                                                            </Tooltip>

                                                        )
                                                    }

                                                </td>
                                            ))
                                        }
                                        {/* ACTION BUTTONS */}

                                        <td
                                            className="sticky right-0 z-10 bg-white px-3 py-2"
                                            style={{ minWidth: 220 }}
                                        >
                                            <div className="flex items-center justify-center gap-2">

                                                {/* VIEW */}

                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item)
                                                        setShowViewModal(true)
                                                    }}
                                                    className="
            text-green-600
            hover:bg-green-600
            hover:text-white
            p-2
            rounded-full
            transition
        "
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* EDIT */}

                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item)
                                                        setShowEditModal(true)
                                                    }}
                                                    className="
            text-blue-600
            hover:bg-blue-600
            hover:text-white
            p-2
            rounded-full
            transition
        "
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                {/* DELETE */}

                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    className="
            text-red-600
            hover:bg-red-600
            hover:text-white
            p-2
            rounded-full
            transition
        "
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )
                        }

                    </tbody>

                </table>
                </div>

                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} results
                    </p>
                    <Pagination
                        current={page}
                        pageSize={limit}
                        total={total}
                        showSizeChanger
                        pageSizeOptions={['5', '10', '20', '50']}
                        onChange={setPage}
                        onShowSizeChange={(c, s) => {
                            setLimit(s)
                            setPage(1)
                        }}
                        size="small"
                    />
                </div>
            </div>

            {/* ── Modals ── */}
            <DeleteModal
                open={showDeleteModal}
                title="Delete Support Ticket"
                description="This action cannot be undone."
                itemName={selectedItem?.title}
                onConfirm={handleDelete}
                onCancel={() => {
                    setShowDeleteModal(false)
                    setSelectedItem(null)
                }}
            />

            <ViewSupportModal
                open={showViewModal}
                onClose={() => setShowViewModal(false)}
                data={selectedItem}
            />

            <EditSupportModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                data={selectedItem}
                onSuccess={() =>
                    setUpdateStatus(prev => !prev)
                }
            />
        </div>

    )
}

export default AdminSupportList