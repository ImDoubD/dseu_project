"use client";
import React, { useState, useEffect } from "react";
import Head from "../dashboard/Head";
import Nav from "../dashboard/Nav";
import { Accordion, AccordionSummary, AccordionDetails, Typography, Checkbox, FormControl, InputLabel, Select, MenuItem, Box, Button, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { fetchDetailsByCampus } from "@/app/actions/api";
import { getAuthAdmin } from "@/app/actions/cookie";
import { parseJwt } from "@/app/actions/utils";

interface CampusData {
    campus: string;
    program: string;
    semester: string;
}
interface User {
    campus: string;
}

export default function Registration() {
    const [campusData, setCampusData] = useState<CampusData[]>([]);
    const [selectedCampus, setSelectedCampus] = useState<string[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<Record<string, string[]>>({});
    const [selectedSemester, setSelectedSemester] = useState<Record<string, string[]>>({});
    const [user, setUser] = useState<User | null>(null);
    const [openCloseModal, setOpenCloseModal] = useState<boolean>(false);
    const [openCloseAction, setOpenCloseAction] = useState<string>("");
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [token, setToken] = useState<string>("");
    const [filterCampus, setFilterCampus] = useState<string[]>([]);
    const [filterProgram, setFilterProgram] = useState<string[]>([]);
    const [filterSemester, setFilterSemester] = useState<string[]>([]);

    useEffect(() => {
        getAuthAdmin().then(async (t: any) => {
            if (t) {
                setToken(t.value);
            }
        });
    }, []);

    useEffect(() => {
        if (token) {
            fetchDetailsByCampus(token)
                .then((res: CampusData[]) => {
                    setCampusData(res);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }, [token]);

    const handleCampusCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const isSelected = event.target.checked;
        setSelectedCampus((prev) => (isSelected ? [...prev, value] : prev.filter((c) => c !== value)));

        setSelectedProgram((prev) => {
            const updatedPrograms = { ...prev };
            if (isSelected) {
                updatedPrograms[value] = campusData.filter((item) => item.campus === value).map((item) => item.program);
            } else {
                delete updatedPrograms[value];
            }
            return updatedPrograms;
        });

        setSelectedSemester((prev) => {
            const updatedSemesters = { ...prev };
            if (isSelected) {
                campusData
                    .filter((item) => item.campus === value)
                    .forEach((item) => {
                        updatedSemesters[`${value}-${item.program}`] = [String(item.semester)];
                    });
            } else {
                Object.keys(updatedSemesters).forEach((key) => {
                    if (key.startsWith(value)) {
                        delete updatedSemesters[key];
                    }
                });
            }
            return updatedSemesters;
        });
    };

    const handleProgramCheckboxChange = (campus: string, program: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setSelectedProgram((prev) => {
            const updatedPrograms = value ? [...(prev[campus] || []), program] : (prev[campus] || []).filter((p) => p !== program);
            return { ...prev, [campus]: updatedPrograms };
        });

        if (value && !selectedCampus.includes(campus)) {
            setSelectedCampus((prev) => [...prev, campus]);
        } else if (!value && selectedProgram[campus]?.length === 1) {
            setSelectedCampus((prev) => prev.filter((c) => c !== campus));
        }

        setSelectedSemester((prev) => {
            const key = `${campus}-${program}`;
            const updatedSemesters = value ? campusData.filter((item) => item.campus === campus && item.program === program).map((item) => String(item.semester)) : [];
            return { ...prev, [key]: updatedSemesters };
        });
    };

    const handleSemesterCheckboxChange = (campus: string, program: string, semester: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setSelectedSemester((prev) => {
            const key = `${campus}-${program}`;
            const updatedSemesters = value ? [...(prev[key] || []), semester] : (prev[key] || []).filter((s) => s !== semester);
            return { ...prev, [key]: updatedSemesters };
        });
    };

    const handleCloseModal = () => {
        setOpenCloseModal(false);
    };

    const handleOpenCloseClick = (action: string) => {
        setOpenCloseAction(action);
        setOpenCloseModal(true);
    };

    const handleConfirmFilteredAction = () => {
        const payload: { campus: string; program: string; semester: string; action: string }[] = [];

        selectedCampus.forEach((campus) => {
            (selectedProgram[campus] || []).forEach((program) => {
                (selectedSemester[`${campus}-${program}`] || []).forEach((semester) => {
                    payload.push({ campus, program, semester, action: openCloseAction });
                });
            });
        });

        console.log(payload);

        setSnackbarMessage(openCloseAction === "open" ? "Exam registrations opened for filtered selection" : "Exam registrations closed for filtered selection");

        setSnackbarOpen(true);
        handleCloseModal();
    };

    const handleFilterChange = (filterType: string, value: string[]) => {
        switch (filterType) {
            case "campus":
                setFilterCampus(value);
                break;
            case "program":
                setFilterProgram(value);
                break;
            case "semester":
                setFilterSemester(value);
                break;
            default:
                break;
        }
    };

    const handleTagDelete = (filterType: string, value: string) => {
        switch (filterType) {
            case "campus":
                setFilterCampus((prev) => prev.filter((item) => item !== value));
                break;
            case "program":
                setFilterProgram((prev) => prev.filter((item) => item !== value));
                break;
            case "semester":
                setFilterSemester((prev) => prev.filter((item) => item !== value));
                break;
            default:
                break;
        }
    };

    const filterAccordions = () => {
        let filteredCampuses = campusData
            .map((item) => item.campus)
            .filter((campus, index, self) => self.indexOf(campus) === index)
            .filter((campus) => filterCampus.length === 0 || filterCampus.includes(campus));

        return filteredCampuses.map((campus, index) => {
            let filteredPrograms = campusData
                .filter((item) => item.campus === campus)
                .map((item) => item.program)
                .filter((program, index, self) => self.indexOf(program) === index)
                .filter((program) => filterProgram.length === 0 || filterProgram.includes(program));

            return (
                <Accordion key={index}>
                    <AccordionSummary expandIcon={<ArrowDropDownIcon />} aria-controls={`panel1-content-${index}`} id={`panel1-header-${index}`}>
                        <Box display="flex" alignItems="center">
                            <Checkbox checked={selectedCampus.includes(campus)} onChange={handleCampusCheckboxChange} value={campus} />
                            <Typography>{campus}</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {filteredPrograms.map((program, programIndex) => (
                            <Accordion key={programIndex}>
                                <AccordionSummary expandIcon={<ArrowDropDownIcon />} aria-controls={`panel2-content-${programIndex}`} id={`panel2-header-${programIndex}`}>
                                    <Box display="flex" alignItems="center">
                                        <Checkbox checked={selectedProgram[campus]?.includes(program) || false} onChange={(event) => handleProgramCheckboxChange(campus, program, event)} value={program} />
                                        <Typography>{program}</Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FormControl fullWidth margin="normal">
                                        <Box display="flex" flexDirection="column">
                                            <h4>Semesters</h4>
                                            <Box>
                                                {campusData
                                                    .filter((item) => item.campus === campus && item.program === program)
                                                    .map((item, semesterIndex) => (
                                                        <Box key={semesterIndex} display="flex" alignItems="center">
                                                            <Checkbox checked={selectedSemester[`${campus}-${program}`]?.includes(String(item.semester)) || false} onChange={(event) => handleSemesterCheckboxChange(campus, program, String(item.semester), event)} value={String(item.semester)} />
                                                            <Typography>{item.semester}</Typography>
                                                        </Box>
                                                    ))}
                                            </Box>
                                        </Box>
                                    </FormControl>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </AccordionDetails>
                </Accordion>
            );
        });
    };

    const getUniqueValues = (data: CampusData[], key: keyof CampusData) => {
        return Array.from(new Set(data.map((item) => item[key])));
    };

    return (
        <>
            <div className="bg-[#dfdede]">
                <Head username={user?.campus} />
                <Nav />
            </div>
            <div className="mt-[154px] max-sm:mt-[150px] px-2 sm:ml-[250px]">
                <div className="bg-dseublue py-2 px-2 sm:mx-8 rounded shadow mt-28">
                    <h1 className="text-2xl text-white font-bold text-center">Exam Control</h1>
                </div>
                <div className="py-2 px-2 rounded shadow max-sm:w-full mt-5 sm:mx-8">
                    <Box display="flex" justifyContent="space-between" mb={2}>
                        <FormControl fullWidth>
                            <InputLabel>Campus</InputLabel>
                            <Select multiple value={filterCampus} onChange={(event) => setFilterCampus(event.target.value as string[])} label="Campus" renderValue={(selected) => (selected as string[]).join(", ")}>
                                {getUniqueValues(campusData, "campus").map((campus, index) => (
                                    <MenuItem key={index} value={campus}>
                                        <Checkbox checked={filterCampus.includes(campus)} />
                                        <Typography>{campus}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Program</InputLabel>
                            <Select multiple value={filterProgram} onChange={(event) => setFilterProgram(event.target.value as string[])} label="Program" renderValue={(selected) => (selected as string[]).join(", ")}>
                                {getUniqueValues(campusData, "program").map((program, index) => (
                                    <MenuItem key={index} value={program}>
                                        <Checkbox checked={filterProgram.includes(program)} />
                                        <Typography>{program}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Semester</InputLabel>
                            <Select multiple value={filterSemester} onChange={(event) => setFilterSemester(event.target.value as string[])} label="Semester" renderValue={(selected) => (selected as string[]).join(", ")}>
                                {getUniqueValues(campusData, "semester").map((semester, index) => (
                                    <MenuItem key={index} value={semester}>
                                        <Checkbox checked={filterSemester.includes(semester.toString())} />
                                        <Typography>{semester}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                        {filterCampus.map((campus, index) => (
                            <Chip key={index} label={campus} onDelete={() => handleTagDelete("campus", campus)} />
                        ))}
                        {filterProgram.map((program, index) => (
                            <Chip key={index} label={program} onDelete={() => handleTagDelete("program", program)} />
                        ))}
                        {filterSemester.map((semester, index) => (
                            <Chip key={index} label={semester} onDelete={() => handleTagDelete("semester", semester)} />
                        ))}
                    </Box>
                    {filterAccordions()}
                    <Box mt={2} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenCloseClick("close")}
                            // disabled={selectedSemester.length === 0}
                        >
                            Close
                        </Button>
                        <Box ml={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenCloseClick("open")}
                                // disabled={selectedSemester.length === 0}
                            >
                                Open
                            </Button>
                        </Box>
                    </Box>
                </div>
            </div>
            <Snackbar anchorOrigin={{ vertical: "bottom", horizontal: "right" }} open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
            <Dialog open={openCloseModal} onClose={handleCloseModal}>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent>`{`Are you sure you want to ${openCloseAction} exam registrations for selected campuses, programs, and semesters?`}``</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmFilteredAction} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
