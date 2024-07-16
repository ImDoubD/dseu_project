import { QueryResult } from "pg";
import pool from "../db";
import { insertStudentDetailsToAggregateQuery, fetchMarkControl, toggleMarkControl, fetchMarksInternal, fetchMarksExternal, fetchMarksAggregate, fetchUsersByCourseCode, fetchDepartDetailsByEmailid, resetPassword, fetchFreezeDetailsQuery, getEmailidAdminQuery, fetchMarkControlDetailsQuery, updateStudentDetailsToAggregateQuery, fetchBridgeStudentDetails, toggleResultControl, fetchResultControlQuery, fetchAllResultQuery, fetchAllResultBridgeQuery, fetchInternalResultQuery, fetchExternalResultQuery, fetchAllMarkSheetQuery, departmentAggregateDetailsQuery, 
    departmentEmails, 
    fetchSemesterCoursesQuery,
    fetchCoursesQuery,
    fetchInternalMarksQuery,
    fetchExternalMarksQuery,
    fetchAggregateMarksQuery} from "./marks_queries";

export function fetchBridgeDetailsModel(email: string, course_code: string, academic_year: string) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT b.rollno,b.marks, u.name,b.freeze
            FROM bridge_course b
            JOIN users u ON b.rollno = u.rollno
            JOIN departments d ON u.program = d.program AND u.semester = d.semester AND u.campus = d.campus
            WHERE d.emailid = $1 AND b.course_code = $2 AND b.academic_year = $3;
        `;

        const values = [email, course_code, academic_year];

        console.log("INTERNAL query:", query);

        pool.query(query, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function deleteBridgeDetailsModel(rollno: string, course_code: string, academic_year: string) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM bridge_course
        WHERE rollno = $1 
        AND course_code = $2 
        AND academic_year = $3;`;

        const values = [rollno, course_code, academic_year];

        console.log("INTERNAL query:", query);

        pool.query(query, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
}

export function insertBridgeDetailsModel(student: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO bridge_course (rollno, course_code, marks, academic_year, "freeze")
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (rollno, course_code, academic_year)
            DO UPDATE SET
                marks = EXCLUDED.marks,
                "freeze" = EXCLUDED."freeze"
        `;

        const values = [student.rollno, student.course_code, student.marks, student.academic_year, student.freeze];

        console.log("INTERNAL query:", query);
        console.log("values: ", values)

        pool.query(query, values, (error, results) => {
            if (error) {
                console.error('Error executing query:', error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function checkDepartmentModel(rollno: any, email: any) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                u.name
            FROM 
                users u
            JOIN 
                departments d ON u.campus = d.campus 
                              AND u.program = d.program 
                              AND u.program_type = d.program_type
                              AND u.semester = d.semester
            WHERE 
                u.rollno = $1 
                AND d.emailid = $2
        `;

        const values = [rollno, email];

        // console.log("INTERNAL query:", query,values);

        pool.query(query, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                // console.log("rows: ", results.rows)
                if (results.rows.length > 0) {
                    resolve(results.rows[0].name);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

export function fetchStudentDetailsFromInternal(details: { campus: string; program_type: string; program: string; semester: number; academic_year: string; course_code: string; rollno: Array<string> }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT u.name, im.rollno, im.campus, im.program_type, im.program, im.semester, im.academic_year, im.marks, im.freeze_marks, im.course_code,  im.created_at
            FROM internal_marks im
            JOIN users u ON im.rollno = u.rollno
            WHERE im.campus='${details.campus}' AND im.program_type='${details.program_type}' AND im.program='${details.program}' AND im.semester='${details.semester}' AND im.course_code='${details.course_code}'AND im.academic_year='${details.academic_year}' AND im.rollno IN (${details.rollno.map((roll) => `'${roll}'`).join(", ")})
            ORDER BY im.rollno
        `;
        console.log("INTERNAL query:", query);
        pool.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                console.log("internal result: ", results.rows)
                resolve(results);
            }
        });
    });
}

export function fetchStudentDetailsFromExternal(details: { campus: string; program_type: string; program: string; semester: number; academic_year: string; course_code: string; rollno: Array<string> }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT u.name, im.rollno, im.campus, im.program_type, im.program, im.semester, im.academic_year, im.marks, im.freeze_marks, im.course_code,  im.created_at
            FROM external_marks im
            JOIN users u ON im.rollno = u.rollno
            WHERE im.campus='${details.campus}' AND im.program_type='${details.program_type}' AND im.program='${details.program}' AND im.semester='${details.semester}' AND im.course_code='${details.course_code}'AND im.academic_year='${details.academic_year}' AND im.rollno IN (${details.rollno.map((roll) => `'${roll}'`).join(", ")})
            ORDER BY im.rollno
        `;
        // console.log("query:",query);
        pool.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function updateStudentDetailsFromInternal(details: { campus: string; program_type: string; program: string; semester: number; course_code: string; academic_year: string; rollno: Array<string>; marks: Array<string>; freeze_marks: boolean; modified_at: string }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        console.log("details: ", details);
        console.log("modified: ", details.modified_at);

        for (let i = 0; i < details.rollno.length; i++) {
            let query = `
                INSERT INTO internal_marks (rollno, campus, program_type, program, semester, course_code, academic_year, marks, freeze_marks, modified_at)
                VALUES ('${details.rollno[i]}', '${details.campus}', '${details.program_type}', '${details.program}', ${details.semester}, '${details.course_code}', '${details.academic_year}', '${details.marks[i]}', '${details.freeze_marks}', '${details.modified_at}')
                ON CONFLICT (rollno, campus, program, semester, course_code, academic_year)
                DO UPDATE SET
                    marks = EXCLUDED.marks,
                    freeze_marks = EXCLUDED.freeze_marks,
                    modified_at = EXCLUDED.modified_at;
            `;

            console.log("query: ", query);
            pool.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }
    });
}


export function updateStudentDetailsFromExternal(details: { campus: string; program_type: string; program: string; semester: number; course_code: string; academic_year: string; rollno: Array<string>; marks: Array<string>; freeze_marks: boolean; modified_at: string }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        console.log("details: ", details);
        console.log("modified: ", details.modified_at);

        for (let i = 0; i < details.rollno.length; i++) {
            let query = `
                INSERT INTO external_marks (rollno, campus, program_type, program, semester, course_code, academic_year, marks, freeze_marks, modified_at)
                VALUES ('${details.rollno[i]}', '${details.campus}', '${details.program_type}', '${details.program}', ${details.semester}, '${details.course_code}', '${details.academic_year}', '${details.marks[i]}', '${details.freeze_marks}', '${details.modified_at}')
                ON CONFLICT (rollno, campus, program, semester, course_code, academic_year)
                DO UPDATE SET
                    marks = EXCLUDED.marks,
                    freeze_marks = EXCLUDED.freeze_marks,
                    modified_at = EXCLUDED.modified_at;
            `;

            console.log("query: ", query);
            pool.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }
    });
}


export function insertStudentDetailsFromInternal(details: { campus: string; program_type: string; program: string; semester: number; course_code: string; academic_year: string; rollno: Array<string>; marks: Array<string>; freeze_marks: boolean; created_at: string; modified_at: string }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        console.log("details: ", details);
        console.log("created: ", details.created_at);
        console.log("modified: ", details.modified_at);

        let query = `INSERT INTO internal_marks (campus, program_type, program, semester, course_code, academic_year, rollno, marks, freeze_marks, created_at, modified_at) VALUES `;

        for (let i = 0; i < details.rollno.length; i++) {
            query += `('${details.campus}', '${details.program_type}', '${details.program}', ${details.semester}, '${details.course_code}', '${details.academic_year}', '${details.rollno[i]}', '${details.marks[i]}', '${details.freeze_marks}',  '${details.created_at}', '${details.modified_at}'),`;
        }

        // Remove the last comma and add a semicolon to end the query
        query = query.slice(0, -1) + ";";

        // console.log("query:", query);

        pool.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function insertStudentDetailsFromExternal(details: { campus: string; program_type: string; program: string; semester: number; course_code: string; academic_year: string; rollno: Array<string>; marks: Array<string>; freeze_marks: boolean; created_at: string; modified_at: string }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        console.log("details: ", details);
        console.log("created: ", details.created_at);
        console.log("modified: ", details.modified_at);

        let query = `INSERT INTO external_marks (campus, program_type, program, semester, course_code, academic_year, rollno, marks, freeze_marks, created_at, modified_at) VALUES `;

        for (let i = 0; i < details.rollno.length; i++) {
            query += `('${details.campus}', '${details.program_type}', '${details.program}', ${details.semester}, '${details.course_code}', '${details.academic_year}', '${details.rollno[i]}', '${details.marks[i]}', '${details.freeze_marks}',  '${details.created_at}', '${details.modified_at}'),`;
        }

        // Remove the last comma and add a semicolon to end the query
        query = query.slice(0, -1) + ";";

        // console.log("query:", query);

        pool.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function insertStudentDetailsIntoAggregate(details: { campus: string; program_type: string; program: string; semester: number; course_code: string; academic_year: string; rollno: Array<string>; marks: Array<string>; freeze_marks: boolean; created_at: string; modified_at: string }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        console.log("details: ", details);
        console.log("created: ", details.created_at);
        console.log("modified: ", details.modified_at);

        let query = `INSERT INTO aggregate_marks (campus, program_type, program, semester, course_code, academic_year, rollno, marks, freeze_marks, created_at, modified_at) VALUES `;

        for (let i = 0; i < details.rollno.length; i++) {
            query += `('${details.campus}', '${details.program_type}', '${details.program}', ${details.semester}, '${details.course_code}', '${details.academic_year}', '${details.rollno[i]}', '${details.marks[i]}', '${details.freeze_marks}',  '${details.created_at}', '${details.modified_at}'),`;
        }

        // Remove the last comma and add a semicolon to end the query
        query = query.slice(0, -1) + ";";

        // console.log("query:", query);

        pool.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function updateStudentDetailsFromAggregate(details: { campus: string; program_type: string; program: string; semester: number; course_code: string; academic_year: string; rollno: Array<string>; marks: Array<string>; freeze_marks: boolean; created_at: string; modified_at: string }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        console.log("details: ", details);
        console.log("created: ", details.created_at);
        console.log("modified: ", details.modified_at);

        for (let i = 0; i < details.rollno.length; i++) {
            let query = `
                INSERT INTO aggregate_marks (rollno, campus, program_type, program, semester, course_code, academic_year, marks, freeze_marks, created_at, modified_at)
                VALUES ('${details.rollno[i]}', '${details.campus}', '${details.program_type}', '${details.program}', ${details.semester}, '${details.course_code}', '${details.academic_year}', '${details.marks[i]}', '${details.freeze_marks}', '${details.created_at}', '${details.modified_at}')
                ON CONFLICT (rollno, campus, program, semester, course_code, academic_year)
                DO UPDATE SET
                    marks = EXCLUDED.marks,
                    freeze_marks = EXCLUDED.freeze_marks,
                    modified_at = EXCLUDED.modified_at;
            `;

            console.log("query:", query);

            pool.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }
    });
}


export function fetchStudentDetailsFromAggregate(details: { campus: string; program_type: string; program: string; semester: number; academic_year: string; course_code: string; rollno: Array<string> }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT u.name, im.rollno, im.campus, im.program_type, im.program, im.semester, im.academic_year, im.marks, im.freeze_marks, im.course_code,  im.created_at
            FROM aggregate_marks im
            JOIN users u ON im.rollno = u.rollno
            WHERE im.campus='${details.campus}' AND im.program_type='${details.program_type}' AND im.program='${details.program}' AND im.semester='${details.semester}' AND im.course_code='${details.course_code}'AND im.academic_year='${details.academic_year}' AND im.rollno IN (${details.rollno.map((roll) => `'${roll}'`).join(", ")})
            ORDER BY im.rollno
        `;
        // console.log("query:",query);
        pool.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function insertIntoAggregateMarks(aggregateDetails: { rollno: string; campus: string; program_type: string; program: string; marks: string; semester: number; freeze_marks: boolean; created_at: string; modified_at: string; academic_year: string; course_code: string }): Promise<QueryResult<any>> {
    // console.log("model rollno: ",rollno)
    return new Promise((resolve, reject) => {
        pool.query(insertStudentDetailsToAggregateQuery, [aggregateDetails.rollno, aggregateDetails.campus, aggregateDetails.program_type, aggregateDetails.program, aggregateDetails.marks, aggregateDetails.semester, aggregateDetails.freeze_marks, aggregateDetails.created_at, aggregateDetails.modified_at, aggregateDetails.academic_year, aggregateDetails.course_code], (error, results) => {
            if (error) {
                console.log("eror: ", error);
                reject(error);
            } else {
                // console.log("error mode: ",results)
                resolve(results);
            }
        });
    });
}

export function updateIntoAggregateMarks(aggregateDetails: { rollno: string; campus: string; program_type: string; program: string; marks: string; semester: number; freeze_marks: boolean; modified_at: string; academic_year: string; course_code: string }): Promise<QueryResult<any>> {
    // console.log("model rollno: ",rollno)
    return new Promise((resolve, reject) => {
        pool.query(updateStudentDetailsToAggregateQuery, [aggregateDetails.rollno, aggregateDetails.campus, aggregateDetails.program_type, aggregateDetails.program, aggregateDetails.semester, aggregateDetails.academic_year, aggregateDetails.course_code, aggregateDetails.marks, aggregateDetails.freeze_marks, aggregateDetails.modified_at], (error, results) => {
            if (error) {
                console.log("eror: ", error);
                reject(error);
            } else {
                // console.log("error mode: ",results)
                resolve(results);
            }
        });
    });
}

export function fetchMarksControlModal(details: { campus: string; program_type: string; program: string; semester: number }): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchMarkControl, [details.campus, details.program_type, details.program, details.semester], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function toggleMarksControlModal(
    details: {
        campus: string;
        program: string;
        semester: number;
        marks_control: boolean;
    }[]
): Promise<QueryResult<any>> {
    console.log(124, details);
    return new Promise((resolve, reject) => {
        details.map((detail) => {
            pool.query(toggleMarkControl, [detail.campus, detail.program, detail.semester, detail.marks_control], (error, results) => {
                if (error) {
                    console.log("error: ", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    });
}

export function toggleResultControlModal(
    details: {
        campus: string;
        program: string;
        semester: number;
        result_control: boolean;
    }[]
): Promise<QueryResult<any>> {
    console.log(124, details);
    return new Promise((resolve, reject) => {
        details.map((detail) => {
            pool.query(toggleResultControl, [detail.campus, detail.program, detail.semester, detail.result_control], (error, results) => {
                if (error) {
                    console.log("error: ", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    });
}

export function fetchMarksInternalModal(rollno: string, academic_year: string, semester: number): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchMarksInternal, [rollno, academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}
export function fetchMarksExternalModal(rollno: string, academic_year: string, semester: number): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchMarksExternal, [rollno, academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}
export function fetchMarksAggregateModal(rollno: string, academic_year: string, semester: number): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchMarksAggregate, [rollno, academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchStudentsCourseCodeModal(course_code: string, campus: string, program_type: string, program: string, semester: string, academic_year: string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchUsersByCourseCode, [course_code, campus, program_type, program, academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchDepartDetailsByEmailidModal(emailid: string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchDepartDetailsByEmailid, [emailid], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}
export function resetPasswordModal(password: string, emailid: string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(resetPassword, [password, emailid], (error, results) => {
            if (error) {
                console.log("error:  ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchFreezeDetailsModel(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchFreezeDetailsQuery, (error, results) => {
            if (error) {
                console.log("error:  ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function getEmailidAdminModel(campus: string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(getEmailidAdminQuery, [campus], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchMarkControlDetailsModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchMarkControlDetailsQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchBridgeStudentDetailsModal(rollno: string, academic_year: string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchBridgeStudentDetails, [rollno, academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchResultControlModal(rollno: string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchResultControlQuery, [rollno], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchAllResultModal( academic_year : string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchAllResultQuery,[academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchInternalResultModal( academic_year : string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchInternalResultQuery,[academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchExternalResultModal( academic_year : string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchExternalResultQuery,[academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchAllResultBridgeModal(academic_year : string): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchAllResultBridgeQuery,[academic_year], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchAllMarkSheetModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchAllMarkSheetQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function departmentAggregateDetailsModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(departmentAggregateDetailsQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}





export function departmentEmailsModal(campus:string, program_type:string, program:string, semester:number): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(departmentEmails, [campus, program_type, program, semester], (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}



export function fetchSemesterCoursesModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchSemesterCoursesQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchCoursesModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchCoursesQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchInternalMarksModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchInternalMarksQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchExternalMarksModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchExternalMarksQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export function fetchAggregateMarksModal(): Promise<QueryResult<any>> {
    return new Promise((resolve, reject) => {
        pool.query(fetchAggregateMarksQuery, (error, results) => {
            if (error) {
                console.log("error: ", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}