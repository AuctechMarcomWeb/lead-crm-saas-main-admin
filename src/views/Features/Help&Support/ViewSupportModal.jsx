/* eslint-disable prettier/prettier */

import React from "react";
import { Modal } from "antd";
import dayjs from "dayjs";

import {
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    UserOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import { FileText } from "lucide-react";

const ViewSupportModal = ({ open, onClose, data }) => {
    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={850}
            centered
            styles={{
                body: {
                    maxHeight: "80vh",
                    overflowY: "auto",
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE
                },

            }}
        >
            <div className="hide-scrollbar">

                {/* Header */}
                <div className=" border-gray-200 pb-4">
                    <h2 className="text-xl text-gray-800 font-medium">
                        Support Details
                    </h2>

                    <div className="mt-3">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${data?.status === "OPEN"
                                ? "bg-yellow-100 text-yellow-700"
                                : data?.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-700"
                                    : data?.status === "RESOLVED"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                        >
                            {data?.status || "OPEN"}
                        </span>
                    </div>
                </div>

                {/* School Details */}
                <div className="bg-gray-50 border rounded-xl p-3 mb-4">
                    <h3 className="text-sm text-gray-700 font-medium mb-4">
                        School Information
                    </h3>

                    <div className="flex flex-col md:flex-row gap-5">

                        {/* Logo */}
                        <div>
                            {data?.schoolId?.logo ? (
                                <img
                                    src={data?.schoolId?.logo}
                                    alt="school-logo"
                                    className="w-24 h-24 rounded-lg border object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 border rounded-lg flex items-center justify-center text-sm text-gray-400">
                                    No Logo
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 flex-1">

                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    School Name
                                </p>

                                <p className="text-sm text-gray-800 font-medium">
                                    {data?.schoolId?.schoolName || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    School Code
                                </p>

                                <p className="text-sm text-gray-800 font-medium">
                                    {data?.schoolId?.schoolCode || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                                    <PhoneOutlined />
                                    Contact
                                </p>

                                <p className="text-sm text-gray-800 font-medium">
                                    {data?.schoolId?.schoolContact || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                                    <MailOutlined />
                                    Email
                                </p>

                                <p className="text-sm text-gray-800 font-medium break-all">
                                    {data?.schoolId?.schoolEmail || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                    <UserOutlined />
                                    Managed By
                                </p>

                                <p className="text-sm text-gray-800 font-medium">
                                    {data?.schoolId?.managedBy || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 font-medium">
                                    Medium
                                </p>

                                <p className="text-sm text-gray-800 font-medium">
                                    {data?.schoolId?.schoolMedium || "—"}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Address */}
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <EnvironmentOutlined />
                            Address
                        </p>

                        <p className="text-sm text-gray-800 font-medium">
                            {data?.schoolId?.schoolAddress || "—"}
                        </p>
                    </div>
                </div>

                {/* Ticket Details */}
                <div className="space-y-5">

                    {/* Title + Route */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">
                                Issue Title
                            </p>

                            <p className="text-sm text-gray-800 font-medium">
                                {data?.title || "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">
                                Page Route
                            </p>

                            <p className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block font-medium break-all">
                                {data?.route || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">
                            Description
                        </p>

                        <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap font-medium">
                            {data?.description || "—"}
                        </p>
                    </div>

                    {/* Admin Reply */}
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">
                            Admin Reply
                        </p>

                        {data?.adminReply ? (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                <p className="text-sm text-green-800 font-medium whitespace-pre-wrap">
                                    {data?.adminReply}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 font-medium">
                                No reply yet
                            </p>
                        )}
                    </div>

                    {/* Attachment Image */}
                    {/* Attachment */}
                    {data?.attachment && (

                        <div className="mt-6">

                            <p className="text-sm font-semibold text-slate-700 mb-3">
                                Attachment
                            </p>

                            <a
                                href={data?.attachment}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition-all"
                            >

                                <div className="w-11 h-11 rounded-xl bg-[#eef2f7] flex items-center justify-center">

                                    <FileText className="w-5 h-5 text-[#042954]" />

                                </div>

                                <div className="flex-1">

                                    <p className="text-sm font-semibold text-slate-700">
                                        View Attachment
                                    </p>

                                    <p className="text-xs text-slate-400 truncate">
                                        {data?.attachment}
                                    </p>

                                </div>

                                {/* <Download className="w-5 h-5 text-slate-500" /> */}

                            </a>

                        </div>
                    )}
                    {/* Dates */}
                    {/* <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                            <CalendarOutlined />
                            Created :
                            {data?.createdAt
                                ? dayjs(data?.createdAt).format("DD MMM YYYY hh:mm A")
                                : "—"}
                        </div>

                        <div className="flex items-center md:justify-end gap-2 text-sm text-gray-600 font-medium">
                            <CalendarOutlined />
                            Updated :
                            {data?.updatedAt
                                ? dayjs(data?.updatedAt).format("DD MMM YYYY hh:mm A")
                                : "—"}
                        </div>

                    </div> */}
                </div>
            </div>


        </Modal>
    );
};

export default ViewSupportModal;