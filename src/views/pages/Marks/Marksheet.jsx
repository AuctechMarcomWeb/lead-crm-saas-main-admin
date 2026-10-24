/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
/* eslint-disable prettier/prettier */
/* eslint-disable react/react-in-jsx-scope */
import React from 'react'

const Marksheet = ({ data, currentSession }) => {
  const { studentDetails, subjects, exams, overallSummary } = data

  const getMarks = (exam, subjectId) => {
    return exam.subjects.find((s) => s.subjectId === subjectId)
  }
  const sessionLabel =
    currentSession?.sessionName ||
    (currentSession?.fromYear && currentSession?.toYear
      ? `${currentSession.fromYear}-${currentSession.toYear}`
      : '')

  return (
    <div className="bg-gray-100 p-2 md:p-6 print:p-0 print:bg-white">
      <div className="bg-white border-2 border-black p-2 md:p-4 overflow-x-auto print:overflow-visible">
        {/* ===== SCHOOL HEADER ===== */}
        <div className="text-center border-b-2 border-black pb-2">
          <h1 className="text-xl md:text-3xl font-bold print:text-2xl">
            Type Your School Name Here
          </h1>
          <p className="text-xs md:text-sm print:text-sm">
            Type Address Here (U Dice Code - 0123456789)
          </p>
        </div>

        <div className="text-center font-bold border-b border-black py-1 text-sm md:text-base print:text-base">
          PROGRESS REPORT : {sessionLabel}
        </div>

        {/* ===== BASIC INFO ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 border-b border-black text-xs md:text-sm print:text-sm">
          <span className="mb-0 pb-0 text-center border-r">
            <b>Admission No:</b> —
          </span>
          <span className="mb-0 pb-0 text-center border-r">
            <b>Class:</b> {studentDetails.class} ({studentDetails.section}) {studentDetails.stream}
          </span>
          <span className="mb-0 pb-0 text-center ">
            <b>Roll No:</b> {studentDetails.rollNumber}
          </span>
        </div>
        

        {/* ===== STUDENT DETAILS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-2 p-2 text-xs md:text-sm print:text-sm">
          <p>
            <b>Student Name:</b> {studentDetails.name}
          </p>
          <p>
            <b>Father Name:</b> {studentDetails.fatherName}
          </p>
          <p>
            <b>Mother Name:</b> {studentDetails.motherName}
          </p>
          <p>
            <b>Date of Birth:</b>
            {new Date(studentDetails.dob).toLocaleDateString('en-GB')}
          </p>
        </div>

        <div className="overflow-x-auto mt-4 print:overflow-visible">
          <table className="w-full table-fixed border-collapse border-2 border-black text-[10px] md:text-sm print:text-xs">
            <thead>
              {/* ===== HEADER ===== */}
              <tr>
                <th
                  rowSpan={2}
                  className="border-2 border-black px-2 py-2 bg-gray-100 text-left"
                  style={{ width: '25%' }}
                >
                  Subject
                </th>

                {exams.map((exam) => (
                  <th
                    key={exam.examId}
                    colSpan={2}
                    className="border-2 border-black text-center font-bold py-1"
                  >
                    {exam.examName}
                  </th>
                ))}
              </tr>

              <tr>
                {exams.map((exam) => (
                  <React.Fragment key={exam.examId + '-headers'}>
                    <th className="border border-black text-center py-1">Max</th>
                    <th className="border border-black text-center py-1">Obt.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ===== SUBJECT ROWS ===== */}
              {subjects.map((subject) => (
                <tr key={subject.subjectId}>
                  <td className="border border-black px-2 py-2 font-medium text-left">
                    {subject.name}
                  </td>

                  {exams.map((exam) => {
                    const marks = getMarks(exam, subject.subjectId)

                    return (
                      <React.Fragment key={exam.examId + '-' + subject.subjectId}>
                        <td className="border border-black text-center">
                          {marks?.maxMarks ?? '-'}
                        </td>

                        <td
                          className={`border border-black text-center ${
                            marks && marks.marksObtained < (marks.maxMarks * 33) / 100
                              ? 'text-red-600 font-bold'
                              : ''
                          }`}
                        >
                          {marks?.marksObtained ?? '-'}
                        </td>
                      </React.Fragment>
                    )
                  })}
                </tr>
              ))}

              {/* ===== TOTAL ROW ===== */}
              <tr className="font-bold bg-gray-100">
                <td className="border-2 border-black text-center py-2">Total</td>

                {exams.map((exam) => (
                  <React.Fragment key={exam.examId + '-total'}>
                    <td className="border-2 border-black text-center">{exam.totalMarks}</td>
                    <td className="border-2 border-black text-center">{exam.totalObtained}</td>
                  </React.Fragment>
                ))}
              </tr>

              {/* ===== RESULT ROW ===== */}
              <tr>
                <td className="border-2 border-black text-center font-bold py-2">Result</td>

                {exams.map((exam) => (
                  <td
                    key={exam.examId + '-result'}
                    colSpan={2}
                    className={`border-2 border-black text-center font-bold ${
                      exam.result === 'FAIL' ? 'text-red-600' : 'text-green-700'
                    }`}
                  >
                    {exam.result} ({exam.percentage?.toFixed(2)}%)
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto mt-4 print:overflow-visible">
          <table className="w-full border-collapse border-2 border-black text-xs md:text-sm print:text-sm">
            <tbody>
              {/* ===== ROW 1 ===== */}
              <tr className="font-bold bg-gray-100">
                <td className="border-2 border-black px-3 py-2 text-center">Overall Marks</td>

                <td className="border-2 border-black px-3 py-2 text-center">Overall Percentage</td>

                <td className="border-2 border-black px-3 py-2 text-center">Overall Result</td>
              </tr>

              {/* ===== ROW 2 ===== */}
              <tr>
                <td className="border-2 border-black px-3 py-2 text-center">
                  {overallSummary.overallTotalObtained} / {overallSummary.overallTotalMarks}
                </td>

                <td className="border-2 border-black px-3 py-2 text-center">
                  {overallSummary.overallPercentage}%
                </td>

                <td
                  className={`border-2 border-black px-3 py-2 text-center font-bold ${
                    overallSummary.overallResult === 'FAIL' ? 'text-red-600' : 'text-green-700'
                  }`}
                >
                  {overallSummary.overallResult}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== SIGNATURES ===== */}
        <div className="grid grid-cols-3 mt-10 text-center text-xs md:text-sm print:text-sm">
          <p>Parents / Guardian Sign</p>
          <p>Class Teacher Sign</p>
          <p>Principal Sign & Stamp</p>
        </div>
      </div>
    </div>
  )
}

export default Marksheet
