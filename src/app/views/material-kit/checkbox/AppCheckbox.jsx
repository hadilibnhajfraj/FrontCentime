import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography } from "@mui/material";
import axios from "axios";

export default function CalendrierAdmin() {
  const [events, setEvents] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 🟦 1. Récupérer toutes les disponibilités des agents
      const dispoRes = await axios.get("http://localhost:4000/disponibilite/all");
      const disponibilites = dispoRes.data.map((item) => ({
        title: `Agent ${item.agentName || item.agentId}`,
        start: item.start,
        end: item.end,
        backgroundColor: "#2196f3", // bleu
        borderColor: "#2196f3"
      }));

      // 🔴🟠🟢 2. Récupérer tous les RDVs (statut inclus)
      const rdvRes = await axios.get("http://localhost:4000/rendezvous/admin", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const rdvs = rdvRes.data.map((rdv) => {
        let color = "#ff9800"; // orange = en_attente
        if (rdv.statut === "valide") color = "#4caf50"; // vert
        else if (rdv.statut === "annule") color = "#f44336"; // rouge

        return {
          id: rdv.id,
          title: rdv.title,
          start: rdv.start,
          end: rdv.end,
          backgroundColor: color,
          borderColor: color
        };
      });

      setEvents([...disponibilites, ...rdvs]);
    } catch (err) {
      console.error("Erreur de chargement admin :", err);
    }
  };
  const handleDateSelect = async (selectInfo) => {
    const agentId = prompt("Entrez l'ID de l’agent à assigner :");
    if (!agentId) return;

    try {
      await axios.post(
        "http://localhost:4000/rendezvous/affecter/admin",
        {
          agentId,
          start: selectInfo.startStr,
          end: selectInfo.endStr
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchData(); // refresh calendar
    } catch (err) {
      console.error("Erreur lors de l'ajout de disponibilité", err);
    }
  };

  return (
    <>
      {/* 🧭 Légende */}
      <Box display="flex" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#2196f3" borderRadius={1} />
          <Typography>Disponibilité Agent</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#4caf50" borderRadius={1} />
          <Typography>RDV Validé</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#ff9800" borderRadius={1} />
          <Typography>RDV en Attente</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#f44336" borderRadius={1} />
          <Typography>RDV Annulé</Typography>
        </Box>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        selectable={true}
        select={handleDateSelect}
        height="auto"
      />
    </>
  );
}
