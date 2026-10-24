/* eslint-disable prettier/prettier */

import React, { useEffect, useState } from "react";

import { Modal } from "antd";

import toast from "react-hot-toast";

import { putRequest } from "../../../Helpers";

const EditSupportModal = ({
    open,
    onClose,
    data,
    onSuccess,
}) => {

    // =========================
    // STATES
    // =========================

    const [status, setStatus] = useState("OPEN");

    const [adminReply, setAdminReply] = useState("");

    const [loading, setLoading] = useState(false);

    // =========================
    // SET DATA
    // =========================

    useEffect(() => {

        if (data) {

            setStatus(data?.status || "OPEN");

            setAdminReply(data?.adminReply || "");
        }

    }, [data]);

    // =========================
    // HANDLE UPDATE
    // =========================

 const handleSubmit = async (e) => {

    e.preventDefault();

    try {

        setLoading(true);

        const payload = {
            status,
            adminReply,
        };

        const res = await putRequest({
            url: `support/update/${data?._id}`,
            cred: payload,
        });

        toast.success(
            res?.data?.message ||
            "Support updated successfully"
        );

        onSuccess();

        onClose();

    } catch (error) {

        console.log(error);

        toast.error(
            error?.response?.data?.message ||
            error?.message ||
            "Update failed"
        );

    } finally {

        setLoading(false);
    }
};

    return (

        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={650}
        >

            {/* HEADER */}

            <div className="mb-4">

                <h2 className="text-xl font-semibold text-gray-800">
                    Update Support
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                    Update support status and admin reply
                </p>

            </div>

            {/* FORM */}

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >

                {/* TITLE */}

                <div>

                    <label className="block text-sm font-medium mb-1">
                        Title
                    </label>

                    <input
                        type="text"
                        value={data?.title || ""}
                        disabled
                        className="
                            w-full
                            border
                            rounded-lg
                            px-3
                            py-2
                            bg-gray-100
                            cursor-not-allowed
                            text-sm
                        "
                    />

                </div>

                {/* DESCRIPTION */}

                <div>

                    <label className="block text-sm font-medium mb-1">
                        Description
                    </label>

                    <textarea
                        value={data?.description || ""}
                        disabled
                        rows={4}
                        className="
                            w-full
                            border
                            rounded-lg
                            px-3
                            py-2
                            bg-gray-100
                            cursor-not-allowed
                            resize-none
                            text-sm
                        "
                    />

                </div>

                {/* STATUS */}

                <div>

                    <label className="block text-sm font-medium mb-1">
                        Status
                    </label>

                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value)
                        }
                        className="
                            w-full
                            border
                            rounded-lg
                            px-3
                            py-2
                            text-sm
                            focus:outline-none
                        "
                    >

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

                {/* ADMIN REPLY */}

                <div>

                    <label className="block text-sm font-medium mb-1">
                        Admin Reply
                    </label>

                    <textarea
                        value={adminReply}
                        onChange={(e) =>
                            setAdminReply(e.target.value)
                        }
                        rows={4}
                        placeholder="Write admin reply..."
                        className="
                            w-full
                            border
                            rounded-lg
                            px-3
                            py-2
                            resize-none
                            text-sm
                            focus:outline-none
                        "
                    />

                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 pt-2">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="
                            px-5
                            py-2
                            border
                            rounded-lg
                            text-sm
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            px-5
                            py-2
                            bg-[#042954]
                            text-white
                            rounded-lg
                            text-sm
                            disabled:opacity-50
                        "
                    >

                        {
                            loading
                                ? "Updating..."
                                : "Update"
                        }

                    </button>

                </div>

            </form>

        </Modal>
    );
};

export default EditSupportModal;