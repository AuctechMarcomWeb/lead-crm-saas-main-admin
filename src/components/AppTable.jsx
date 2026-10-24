/* eslint-disable prettier/prettier */
/**
 * AppTable — Shared table component for consistent UI across the application.
 *
 * Usage:
 * <AppTable
 *   columns={[{ key: 'name', label: 'Name', align: 'left', width: 180 }]}
 *   data={items}
 *   loading={loading}
 *   emptyText="No records found"
 *   page={page}
 *   limit={limit}
 *   total={total}
 *   onPageChange={(p) => setPage(p)}
 *   onPageSizeChange={(size) => { setLimit(size); setPage(1) }}
 *   rowKey={(row) => row._id}
 *   onRowClick={(row) => navigate(`/detail/${row._id}`)}
 * >
 *   {(row, index) => (
 *     <>
 *       <td className="app-td text-center">{index + 1}</td>
 *       <td className="app-td">{row.name}</td>
 *     </>
 *   )}
 * </AppTable>
 */

import React from 'react'
import { Empty, Pagination } from 'antd'
import Loader from './Loading/Loader'

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const AppTable = ({
  columns = [],
  children,
  data = [],
  loading = false,
  emptyText = 'No records found',
  page,
  limit,
  total,
  onPageChange,
  onPageSizeChange,
  rowKey = (row, i) => row?._id ?? i,
  onRowClick,
  className = '',
  minHeight = 200,
}) => {
  const hasPagination = total != null && onPageChange != null
  const showingFrom = page && limit ? (page - 1) * limit + 1 : null
  const showingTo = page && limit && total != null ? Math.min(page * limit, total) : null

  return (
    <div
      className={`relative bg-white border border-gray-200 rounded-lg overflow-x-auto ${className}`}
      style={{ minHeight }}
    >
      {/* ── Loading Overlay ── */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-white/70 flex flex-col items-center justify-center rounded-lg">
          <Loader />
          <p className="text-sm text-gray-400 mt-2">Loading records...</p>
        </div>
      )}

      {/* ── Table ── */}
      <table className="min-w-max border-collapse w-full">
        {/* ── Head ── */}
        <thead className="bg-[#EEF2F7] text-gray-700">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-4 py-2.5 text-sm font-semibold whitespace-nowrap select-none',
                  alignClass[col.align ?? 'left'],
                  col.sticky === 'left' && 'sticky left-0 z-20 bg-[#EEF2F7]',
                  col.sticky === 'right' && 'sticky right-0 z-20 bg-[#EEF2F7]',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={col.width ? { minWidth: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {!loading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-12">
                  <Empty description={emptyText} />
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className={[
                  'border-t border-gray-100',
                  onRowClick ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {children ? children(row, index) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── Pagination ── */}
      {hasPagination && !loading && data.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          {showingFrom != null && (
            <p className="text-xs text-gray-500 select-none">
              Showing <span className="font-medium text-gray-700">{showingFrom}</span>–
              <span className="font-medium text-gray-700">{showingTo}</span> of{' '}
              <span className="font-medium text-gray-700">{total}</span> records
            </p>
          )}
          <Pagination
            current={page}
            pageSize={limit}
            total={total}
            onChange={onPageChange}
            showSizeChanger={!!onPageSizeChange}
            onShowSizeChange={(_, size) => onPageSizeChange && onPageSizeChange(size)}
            pageSizeOptions={['5', '10', '20', '50', '100', '200', '500']}
            size="small"
          />
        </div>
      )}
    </div>
  )
}

/** Standard body cell */
export const Td = ({ children, className = '', sticky, align = 'left', onClick, ...props }) => (
  <td
    onClick={onClick}
    className={[
      'px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap',
      { left: 'text-left', center: 'text-center', right: 'text-right' }[align],
      sticky === 'left' && 'sticky left-0 z-10 bg-white',
      sticky === 'right' && 'sticky right-0 z-10 bg-white',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </td>
)

export default AppTable
