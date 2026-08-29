const tmMembership = { roleInProject: "TM" }; // NO employee!
try {
  console.log(tmMembership?.employee.id);
  console.log("SAFE");
} catch(e) {
  console.error("ERROR", e.message);
}
