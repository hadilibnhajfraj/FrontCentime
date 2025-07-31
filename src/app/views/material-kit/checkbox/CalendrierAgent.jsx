import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box, Typography, Modal, Button, Snackbar, Alert, Box as MuiBox
} from "@mui/material";
import axios from "axios";
import useAuth from "app/hooks/useAuth";

export default function CalendrierAgent() {
  const [events, setEvents] = useState([]);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const { user } = useAuth();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const dispoRes = await axios.get("http://localhost:4000/disponibilite/all");
      const disponibilites = dispoRes.data.map((item) => ({
        title: `Agent ${item.agentName || item.agentId}`,
        start: item.start,
        end: item.end,
        backgroundColor: "#2196f3",
        borderColor: "#2196f3"
      }));

      const [pendingRes, valideRes] = await Promise.all([
        axios.get("http://localhost:4000/rendezvous/pending-validation", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:4000/rendezvous/agent/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const pendingRDVs = pendingRes.data.map((rdv) => ({
        id: rdv.id,
        title: "RDV à valider",
        start: rdv.dateRdv,
        end: new Date(new Date(rdv.dateRdv).getTime() + rdv.duree * 60000),
        backgroundColor: "#ff9800",
        borderColor: "#ff9800"
      }));

      const validRDVs = valideRes.data
        .filter((rdv) => rdv.statut === "valide")
        .map((rdv) => ({
          id: rdv.id,
          title: `RDV confirmé: ${rdv.client?.partner?.name || "Client"}`,
          start: rdv.dateRdv,
          end: new Date(new Date(rdv.dateRdv).getTime() + rdv.duree * 60000),
          backgroundColor: "#4caf50",
          borderColor: "#4caf50"
        }));

      setEvents([...disponibilites, ...pendingRDVs, ...validRDVs]);
    } catch (err) {
      console.error("Erreur agent :", err);
    }
  };

  const handleSelect = async (info) => {
    try {
      const res = await axios.post(
        "http://localhost:4000/disponibilite/",
        {
          agentId: user.id,
          start: info.startStr,
          end: info.endStr
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setEvents((prev) => [
        ...prev,
        {
          title: `Agent ${user.id}`,
          start: res.data.start,
          end: res.data.end,
          backgroundColor: "#2196f3",
          borderColor: "#2196f3"
        }
      ]);
    } catch (err) {
      alert("Erreur enregistrement disponibilité");
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedRdv({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end
    });
    setOpenConfirm(true);
  };

  const handleDecision = async (decision) => {
    try {
      await axios.put(
        `http://localhost:4000/rendezvous/agent/valider/${selectedRdv.id}`,
        { decision },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnack({
        open: true,
        message: decision === "valider" ? "RDV accepté" : "RDV refusé",
        severity: decision === "valider" ? "success" : "warning"
      });

      setOpenConfirm(false);
      fetchData();
    } catch (error) {
      setSnack({ open: true, message: "Erreur validation", severity: "error" });
    }
  };

  return (
    <>
      <Box display="flex" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#2196f3" borderRadius={1} />
          <Typography>Disponibilité</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#4caf50" borderRadius={1} />
          <Typography>RDV Confirmé</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#ff9800" borderRadius={1} />
          <Typography>RDV à valider</Typography>
        </Box>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable
        selectMirror
        select={handleSelect}
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />

      <Modal open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <MuiBox
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 24
          }}
        >
          <Typography variant="h6" mb={2}>
            Valider ce rendez-vous ?
          </Typography>
          <Typography mb={2}>
            Du : {new Date(selectedRdv?.start).toLocaleString()} <br />
            Au : {new Date(selectedRdv?.end).toLocaleString()}
          </Typography>

          <Button
            variant="contained"
            color="success"
            onClick={() => handleDecision("valider")}
            sx={{ mr: 2 }}
          >
            Accepter
          </Button>
          <Button variant="outlined" color="error" onClick={() => handleDecision("refuser")}>
            Refuser
          </Button>
        </MuiBox>
      </Modal>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
