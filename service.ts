import { Request, Response } from "express";
import { QueryResult } from "pg";
import {
    fetchPasswordByRollNo,
    fetchTokenByRollNo,
    putDetailsByRollno,
    updateToken,
    fetchUser,
    // addExamRegisteration,
    fetchCourses,
    fetchCoursesRollNo,
    fetchExamRegistration,
    fetchExamRegistrationCourse,
    fetchExamRegistrationProgramAndSemester,
    insertUsers,
    insertExamRegisterations,
    fetchProgram,
    fetchEmailId,
    otpUpdateModel,
    otpVerifyModel,
    updatePassword,
    fetchStudent,
    fetchStudentCampus,
    fetchPasswordByEmailId,
    fetchCourseDetails,
    updateMultipleDetails,
    updateExam,
    fetchCampus,
    deleteExamRegisteration,
    fetchExamControlModal,
    fetchSpecializationModal,
    fetchCourseDetailsModal,
    fetchAllExamControlDetailsModal,
    resetStudentModal,
    otpUpdateModelAdmin,
    otpVerifyModelAdmin,
    updatePasswordAdmin,
    fetchEmailID,
    fetchAllStudentsModals,
    fetchAllRegisterStudentsModal,
    fetchAllStudentCampusModal,
    fetchAllRegisterStudentCampusModal,
    fetchUserDetails,
    fetchExamCourseDetails,
    fetchSemesterCourseDetails,
    fetchOtpTimeModel
} from "./model";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcrypt";
import generateOTP from "./otp_generator"
import { transporter } from "./controller";
import { fetchAllStudentCampus } from "./queries";

export function handleLogin(
    rollno: string,
    password: string
): Promise<{ token: string; defaultPass: boolean }> {
    console.log("service")
    return new Promise((resolve, reject) => {
        fetchPasswordByRollNo(rollno)
            .then((results: QueryResult<any>) => {
                if (results.rows.length > 0) {
                    const dbPassword = results.rows[0].password;
                    bcrypt
                        .compare(password, dbPassword)
                        .then(function (result) {
                            if (result) {
                                // Exclude password and OTP fields from the user object
                                const { password, otp, ...userWithoutSensitiveInfo } = results.rows[0];

                                const token = jwt.sign(
                                    { user: userWithoutSensitiveInfo },
                                    "chotahathi",
                                    {
                                        expiresIn: "2h",
                                    }
                                );

                                let subpass = (results.rows[0].name.toUpperCase()).substring(0, 4);
                                subpass = subpass.split(" ")[0];
                                const pass = subpass + rollno;
                                const default_pass = pass;

                                const result = {
                                    token: token,
                                    defaultPass: results.rows[0].campus === null,
                                };
                                resolve(result);
                            } else {
                                reject("incorrect password");
                            }
                        });
                } else {
                    reject("roll no. doesn't exist");
                }
            })
            .catch((error) => {
                reject("internal server error");
            });
    });
}

export async function handleLoginByEmailId(
    emailid: string,
    password: string
): Promise<{ token: string;}> {
    console.log("service")
    return new Promise(async (resolve, reject) => {
        fetchPasswordByEmailId(emailid)
            .then(async(results: QueryResult<any>) => {
                if (results.rows.length > 0) {
                    const dbPassword = results.rows[0].password;
                    // const hash = await bcrypt.hash("DSEU@12345", 10);
                    // console.log("pass:",hash);
                    bcrypt
                        .compare(password, dbPassword)
                        .then(function (result) {
                            if (result) {
                                delete results.rows[0].password;
                                const token = jwt.sign(
                                    { user: results.rows[0] },
                                    "motahathi",
                                    {
                                        expiresIn: "2h",
                                    }
                                );
                                // const default_pass =
                                //     (results.rows[0].name + "0000").substring(
                                //         0,
                                //         4
                                //     ) + rollno;

                                const result = {
                                    token: token
                                };
                                resolve(result);
                            } else {
                                reject("incorrect password");
                            }
                        });
                } else {
                    reject("email id doesn't exist");
                }
            })
            .catch((error) => {
                reject("internal server error");
            });
    });
}

async function uploadFile(file: File): Promise<string> {
    try {
        // const formData = new FormData();
        // formData.append("file", file);
        const response = await fetch("http://localhost:8000/upload", {
            method: "POST",
            body: file,
        });
        const data = await response.json();
        return data.link; // Assuming the API returns the link of the uploaded file
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Error uploading file");
    }
}

export function fetchUserByRollno(rollno: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fetchUser(rollno)
            .then((results) => {
                resolve(results.rows);
            })
            .catch((error) => {
                console.log("Service error: ", error);
                reject("internal server error");
            });
    });
}

export async function updateDetails(
    rollno: string,
    program: string,
    semester: number,
    date_of_birth: string,
    phone: string,
    campus: string,
    emailid: string,
    gender: string,
    alternate_phone: string,
    father: string,
    mother: string,
    guardian: string,
    aadhar: string,
    abc_id: string,
    pwbd_certificate: string,
    photo: string,
    program_type: string,
    password: string,
    year_of_admission: string,
): Promise<string> {
    try {
        const last_modified: string = new Date().toString();
        console.log("rollno 2 ", rollno);

        const passwordResult = await fetchPasswordByRollNo(rollno);
        console.log("service ", passwordResult.rows);
        // const currentDetails = await fetchUserByRollno(rollno);
        // console.log("service current ", currentDetails[0]);
        
        
        // Check if campus, program, or semester has been updated
        
        const isCampusUpdated = passwordResult.rows[0].campus !== campus;
        const isProgramUpdated = passwordResult.rows[0].program !== program;
        const isSemesterUpdated = passwordResult.rows[0].semester !== semester;
        const currentPassword = passwordResult.rows[0].password;
        

        
        // If any of these fields have been updated, call deleteExamRegistration
        if (isCampusUpdated || isProgramUpdated || isSemesterUpdated) {
            await deleteExamRegisteration(rollno);
        }
        
        if (passwordResult.rows.length > 0) {
            const hash = await bcrypt.hash(password, 10);
            const pw = password === "" ? currentPassword:hash ;
            
            
            const results = await putDetailsByRollno(
                rollno,
                program,
                semester,
                date_of_birth,
                phone,
                campus,
                emailid,
                gender,
                alternate_phone,
                father,
                mother,
                guardian,
                aadhar,
                abc_id,
                pwbd_certificate, // Use the uploaded link if available, otherwise use the original value
                photo, // Use the uploaded link if available, otherwise use the original value
                program_type,
                pw,
                year_of_admission,
                last_modified,
            );

            return "successfully updated!";

        } else {
            throw new Error("rollno not found!");
        }
    } catch (error) {
        console.log(error);
        throw new Error("internal server error");
    }
}



export async function updateMultipleUsersDetails(users: Array<{ rollno: string, father: string, mother: string, aadhar: string, abc_id: string }>): Promise<string> {
    try {
        for (const user of users) {
            console.log("Updating details for rollno: ", user.rollno);
            const results = await updateMultipleDetails(user.rollno, user.father, user.mother, user.aadhar, user.abc_id);
            console.log("Update results: ", results);
        }
        return "All users successfully updated!";
    } catch (error) {
        console.error("Error updating multiple users: ", error);
        throw new Error("internal server error");
    }
}

export async function verifyTokenByRollNo(rollno: string) {
    try {
        const result = await fetchTokenByRollNo(rollno);
        return result.rows[0]; // Return token data or null if not found
    } catch (error) {
        throw new Error("Error verifying token");
    }
}



export function fetchTheCourses(
    campus: string,
    program: string,
    semester: number,
    program_type: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        fetchCourses(campus, program, semester, program_type)
            .then((results) => {
                resolve(results.rows);
            })
            .catch((error) => {
                console.log("error in fetching courses: ", error);
                reject("Internal server error 1");
            });
    });
}

export function fetchTheCoursesRollNo(rollno: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fetchCoursesRollNo(rollno)
            .then((results) => {
                console.log("results: ",results.rows);
                // console.log("results: ",fetchSpecializationModal(results.rows[0].program));
                fetchSpecializationModal(results.rows[0].program).then((specialResults)=>{
                    console.log("special: ",specialResults.rows[0]);
                    if(!specialResults.rows.length){
                        resolve(results.rows);
                    } else {
                        console.log("sem:",results.rows[0].semester, "program type",results.rows[0].program_type);
                        fetchCourseDetailsModal(rollno, specialResults.rows[0].program).then((extraResults)=>{
                            console.log("extra results: ",extraResults.rows[0]);
                            let combinedResults = [...results.rows, ...extraResults.rows];
                            resolve(combinedResults);
                        })
                    }
                })
                
            })
            .catch((error) => {
                console.log("error in fetching courses by rollno: ", error);
                reject("Internal server error roll 1");
            });
    });
}

export async function fetchTheExamRegistration(rollno: string): Promise<any> {
    try {
        const examRegistrationPromise = fetchExamRegistration(rollno);
        const userDetailsPromise = fetchUserDetails(rollno);

        const [examRegistration, userDetails] = await Promise.all([
            examRegistrationPromise,
            userDetailsPromise
        ]);

        if (examRegistration.rows.length === 0) {
            throw new Error("No exam registration found for the given roll number");
        }

        const courseCodes = examRegistration.rows.map(row => row.course_code);

        const [examCourseDetails, semesterCourseDetails] = await Promise.all([
            fetchExamCourseDetails(courseCodes),
            fetchSemesterCourseDetails(
                courseCodes,
                userDetails.rows[0].program_type,
                userDetails.rows[0].program,
                userDetails.rows[0].campus
            )
        ]);

        // Combine and transform the data
        const combinedData = examRegistration.rows.map(regItem => {
            const courseDetails = examCourseDetails.rows.find(c => c.course_code === regItem.course_code);
            const semesterDetails = semesterCourseDetails.rows.find(s => s.course_code === regItem.course_code);
            
            return {
                course_code: regItem.course_code,
                course_name: courseDetails ? courseDetails.course_name : '',
                last_modified: regItem.last_modified,
                course_type: semesterDetails ? semesterDetails.course_type : ''
            };
        });

        return combinedData;
    } catch (error) {
        console.error("Error in fetching exam registration:", error);
        throw new Error("Internal server error: Unable to fetch exam registration");
    }
}

export function fetchTheExamRegistrationCourse(
    campus: string,
    course_code: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        fetchExamRegistrationCourse(campus, course_code)
            .then((result) => {
                resolve(result.rows);
            })
            .catch((error) => {
                console.log(
                    "error in fetching exam registeration by course: ",
                    error
                );
                reject(
                    "Internal server error fetch exam registeration course 1"
                );
            });
    });
}

export function fetchTheExamRegistrationProgramAndSemester(
    campus: string,
    program_type: string,
    program: string,
    semester: number
): Promise<any> {
    return new Promise((resolve, reject) => {
        fetchExamRegistrationProgramAndSemester(campus, program_type ,program, semester)
            .then((result) => {
                const data = result.rows;
                // console.log("data: ", data)
                let students:any = {};
                data.forEach((student)=>{
                    const {rollno, name, dob, photo, program, semester, course_code} = student;
                    if(!students[rollno]){
                        students[rollno]= {rollno, name, dob, photo, program, semester, course_codes: [course_code]};
                    }else{
                        students[rollno].course_codes.push(course_code);
                    }
                })
                resolve(Object.values(students));
            })
            .catch((error) => {
                console.log(
                    "error in fetching exam registeration by program and course: ",
                    error
                );
                reject(
                    "Internal server error fetch exam registeration progrtam and semester 1"
                );
            });
    });
}

export function insertTheUsers(users: any): Promise<any> {
    console.log("hello");
    return new Promise((resolve, reject) => {
        let data: any = [];
        // Use Promise.all to wait for all bcrypt hash operations to complete
        Promise.all(
            users.map((user: any) => {
                let subpass = (user.name.toUpperCase()).substring(0, 4);
                subpass = subpass.split(" ")[0];
                const password = subpass +user.rollno;
                console.log(password);
                return new Promise((resolve, reject) => {
                    bcrypt.hash(password, 10, function (err, hash) {
                        data.push({ ...user, password: hash });
                        resolve(data);
                    });
                });
            })
        )
            .then(() => {
                console.log("data: ", data);
                // Assuming insertUsers returns a Promise
                insertUsers(data)
                    .then((result) => {
                        resolve(result.rows);
                    })
                    .catch((error) => {
                        console.log("Error in inserting users: ", error);
                        reject("Internal server error in insertUsers 1");
                    });
            })
            .catch((error) => {
                console.log("Error in hashing passwords: ", error);
                reject("Internal server error in hashing passwords");
            });
    });
}

export function insertTheExamRegisterations(registeration: any): Promise<any> {
    console.log("hello: ", registeration);
    return new Promise((resolve, reject) => {
        insertExamRegisterations(registeration)
            .then((result) => {
                resolve(result.rows);
            })
            .catch((error) => {
                console.log("Error in inserting exam registerations: ", error);
                reject("Internal server error in insertExamRegisterations");
            });
    });
}

export function fetchTheProgram(program_type: string) : Promise<any> {
    return new Promise((resolve,reject) => {
        fetchProgram(program_type).then((result) => {
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in fetching programs: ",error);
            reject("Internal server error in insertExamRegisterations");
        })
    })
}

export function fetchTheEmailId(rollno: string) : Promise<any> {
    return new Promise((resolve,reject) => {
        fetchEmailId(rollno).then((result) => {
            // console.log(result.rows[0].emailid);
            resolve(result.rows[0].emailid);
        }).catch((error) => {
            console.log("Error in fetching email: ",error);
            reject("Internal server error in fetchingEmailid");
        })
    })
}

export function otpUpdateService(otp:string, rollno: string,currentTime:string) : Promise<any> {
    return new Promise((resolve,reject) => {
        otpUpdateModel(otp, rollno,currentTime).then((result) => {
            resolve(result);
        }).catch((error) => {
            console.log("Error in otp udation: ",error);
            reject("Internal server error in otp updation");
        })
    })
}

export function fetchOtpTimeService(rollno: string) : Promise<any> {
    return new Promise((resolve,reject) => {
        fetchOtpTimeModel( rollno).then((result) => {
            resolve(result);
        }).catch((error) => {
            console.log("Error in otp udation: ",error);
            reject("Internal server error in otp updation");
        })
    })
}

export function otpUpdateServiceAdmin(otp:string, emailid: string) : Promise<any> {
    return new Promise((resolve,reject) => {
        otpUpdateModelAdmin(otp, emailid).then((result) => {
            resolve(result);
        }).catch((error) => {
            console.log("Error in otp udation: ",error);
            reject("Internal server error in otp updation");
        })
    })
}

export function otpVerifyService( rollno: string) : Promise<any> {
    return new Promise((resolve,reject) => {
        otpVerifyModel(rollno).then((result) => {
            resolve(result);
        }).catch((error) => {
            console.log("Error in otp validation: ",error);
            reject("Internal server error in otp validation");
        })
    })
}
export function otpVerifyServiceAdmin( emailid: string) : Promise<any> {
    return new Promise((resolve,reject) => {
        otpVerifyModelAdmin(emailid).then((result) => {
            resolve(result);
        }).catch((error) => {
            console.log("Error in otp validation: ",error);
            reject("Internal server error in otp validation");
        })
    })
}

export async function updateThePassword(password:string, rollno: string,otp:string) : Promise<any> {
    const hash = await bcrypt.hash(password, 10);
    const verifyOtp:any=await otpVerifyService(rollno);
    if(otp!==verifyOtp.rows[0].otp){
        console.log("returend from here");
        return ("incorrect OTP")
    }
    return new Promise((resolve,reject) => {
        
        updatePassword(hash, rollno).then((result) => {
            console.log("done")
            resolve(result);
        }).catch((error) => {

            console.log("Error in password updation: ",error);
            reject("Internal server error in password updation");
        })
    })
}

export async function updateThePasswordAdmin(password:string, emailid: string) : Promise<any> {
    const hash = await bcrypt.hash(password, 10);
    return new Promise((resolve,reject) => {
        updatePasswordAdmin(hash, emailid).then((result) => {
            resolve(result);
        }).catch((error) => {
            console.log("Error in password updation: ",error);
            reject("Internal server error in password updation");
        })
    })
}

export function fetchTheStudent(program_type: string, program: string, semester: number) : Promise<any> {
    return new Promise((resolve,reject) => {
        fetchStudent(program_type, program, semester).then((result) => {
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in password updation: ",error);
            reject("Internal server error in password updation");
        })
    })
}

export function fetchTheStudentCampus(campus:string, program_type: string, program: string, semester: number) : Promise<any> {
    return new Promise((resolve,reject) => {
        fetchStudentCampus(campus, program_type, program, semester).then((result) => {
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in password updation: ",error);
            reject("Internal server error in password updation");
        })
    })
}

export function fetchTheCourseDetails(courseDetails:any): Promise<any> {
    console.log("Fetching course details...");
    return new Promise((resolve, reject) => {
        fetchCourseDetails(courseDetails)
            .then((result) => {
                resolve(result.rows);
            })
            .catch((error) => {
                console.log("Error in fetching course details: ", error);
                reject("Internal server error in fetchCourseDetails");
            });
    });
}


export async function updateTheExam(users: Array<{ campus:string, program:string, semester:number, exam_control: boolean}>, email_control: boolean): Promise<string> {
    try {
        let emailResults;
        let emailid;
        let emailArray = [];
        let emailString;
        for (const user of users) {
            const results = await updateExam(user.campus, user.program, user.semester, user.exam_control);
            
            if(user.exam_control === true && email_control === true){
                emailResults = await fetchEmailID(user.campus, user.program, user.semester);
                emailid = emailResults?.rows[0]?.emailid; 
                
                for (let i = 0; i < (emailResults.rowCount as number) ; i++) {
                    emailArray.push(emailResults?.rows[i]?.emailid);
                }
            }
        }

        emailString = emailArray.join(", ");
        console.log("emailid 1: ",emailString);
        console.log("emailid 2: ",emailResults);
        console.log("emailid 3: ",emailArray.length);

        // Send the email
        const mailOptions = {
            from: process.env.SMTP_MAIL,
            // to: 'acoe@dseu.ac.in',
            cc: emailString,
            subject: 'Exam Registration',
            text: `This is a testing email. 5\n Please ignore this! 5`
        };
        return new Promise((resolve, reject)=>{
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    reject('Internal Server Error!');
                } else {
                    console.log('Email sent successfully!');
                    resolve('Email sent successfully!' );
                }
            });
        }) 

    } catch (error) {
        console.error("Error updating multiple users: ", error);
        throw new Error("internal server error");
    }
}




// export function fetchTheExamControl(campus:string, program:string, semester:number, program_type:string): Promise<any> {
//     return new Promise((resolve, reject) => {
//         fetchExamControlModal(campus, program, semester, program_type).then((results)=>{
//             console.log("exam control:", results.rows);
//             resolve(results.rows[0]);
//         }).catch((error) => {
//             console.log("Error in fetching exam control: ", error);
//             reject("Internal server error in fetchExamControl");
//         });
//     });
// }

export function fetchTheExamControl(campus:string, program:string, semester:number, programtype:string): Promise<any> {
    return new Promise((resolve, reject) => {
        fetchExamControlModal(campus, program, semester, programtype).then((results)=>{
            console.log("exam control:", results.rows);
            resolve(results.rows[0]);
        }).catch((error) => {
            console.log("Error in fetching exam control: ", error);
            reject("Internal server error in fetchExamControl");
        });
    });
}

export function fetchTheCampus(): Promise<any> {
    return new Promise((resolve,reject) => {
        fetchCampus().then((result) =>{
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in fetching campus details: ", error);
                reject("Internal server error in fetchCampusDetails");
        })
    })
}

export function deleteExam(rollno: string): Promise<any> {
    return new Promise((resolve,reject) => {
        deleteExamRegisteration(rollno).then((result) =>{
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in deleting exam reg. details: ", error);
                reject("Internal server error in delete exam reg.");
        })
    })
}

export function fetchAllExamControlDetailsService(): Promise<any> {
    return new Promise((resolve,reject) => {
        fetchAllExamControlDetailsModal().then((result) =>{
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in fetching exam reg. details: ", error);
                reject("Internal server error in fetch exam reg.");
        })
    })
}


export function resetStudentService(
    rollno:string,
    name:string,
): Promise<any> {
    return new Promise(async(resolve,reject) => {
        const last_modified: string = new Date().toString();
        let subpass = (name.toUpperCase()).substring(0, 4);
        subpass = subpass.split(" ")[0];
        const pass = subpass +rollno;
        const hsh = await hash(pass, 10);
        resetStudentModal(rollno, name, hsh, last_modified).then((result) =>{
            resolve(result.rows);
        }).catch((error) => {
            console.log("Error in reseting student details: ", error);
                reject("Internal server error in reseting student details");
        })
    })
}

export function fetchStudentService():Promise<any>{
    return new Promise(async(resolve, reject) =>{
        const campus=["DSEU Rajokri Campus",
            "Sir C.V. Raman DSEU Dheerpur Campus",
            "Aryabhatt DSEU Ashok Vihar Campus",
            "Guru Nanak Dev DSEU Rohini Campus",
            "Ambedkar DSEU Shakarpur Campus-I",
            "DSEU Sirifort Campus",
            "DSEU Dwarka Campus",
            "DSEU Champs Okhla - II Campus",
            "GB Pant DSEU Okhla III Campus",
            "DSEU Pusa II Campus",
            "Kasturba DSEU Pitampura Campus",
            "Bhai Parmanand DSEU Shakarpur II Campus",
            "DSEU Wazirpur-I Campus",
            "DSEU Jaffarpur Campus",
            "G.B. Pant DSEU Okhla I Campus",
            "Meerabai DSEU Maharani Bagh Campus",
            "DSEU Pusa Campus - I",
            "DSEU Ranhola Campus",
            "Dr.H.J. Bhabha DSEU Mayur Vihar Campus",
            "DSEU Vivek Vihar Campus",
            "DSEU Okhla II Campus"
        ];

        const totalStudents = await fetchAllStudentsModals();
        const registeredStudents = await fetchAllRegisterStudentsModal();

        let campusPromises = [];

        for (let i = 0; i < campus.length; i++) {
            campusPromises.push(
                Promise.all([
                    fetchAllStudentCampusModal(campus[i]),
                    fetchAllRegisterStudentCampusModal(campus[i])
                ]).then(([totalStudentCampus, registeredStudentCampus]) => {
                    return {
                        campusName: campus[i],
                        totalStudentCampus: totalStudentCampus.rows[0],
                        registeredStudentCampus: registeredStudentCampus.rows[0]
                    };
                })
            );
        }

        Promise.all(campusPromises).then((campusData) => {
            resolve({
                totalStudents: totalStudents.rows[0],
                registeredStudents: registeredStudents.rows[0],
                campusData
            });
        })
        .catch((error) => reject(error));
    });
}




