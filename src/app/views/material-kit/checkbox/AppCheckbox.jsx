// src/views/calendrier/CalendrierAdmin.jsx
import { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const API_BASE = "http://localhost:4000";
const AFFECT_URL = `${API_BASE}/rendezvous/affecter/admin`;

const COLORS = {
  dispo: "#2196f3",
  valide: "#4caf50",
  attente: "#ff9800",
  annule: "#f44336",
};

export default function CalendrierAdmin() {
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null); // { startStr, endStr }
  const token = localStorage.getItem("token");

  // index rapide: { "10": {id:10, name:"NADHIR AZZOUZ", email:"..."}, ... }
  const agentIndex = useMemo(
    () => Object.fromEntries(agents.map((a) => [String(a.id), a])),
    [agents]
  );

  useEffect(() => {
    // Charger d’abord les agents pour que les noms soient disponibles,
    // puis les données calendrier
    (async () => {
      await fetchAgents();
      await fetchData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAgents = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/routes/users/by-group?group=employee&limit=200`,
        authHeader
      );

      const items = (res.data || [])
        .map((u) => {
          const id = u.id ?? u.value;
          const name =
            u?.partner?.name ||
            u?.partner_name ||
            u?.label ||
            u?.login ||
            `Employé #${id}`;
          const email = u?.partner?.email || u?.email || null;
          return { id, name, email };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setAgents(items);
    } catch (e) {
      console.error("Erreur chargement agents:", e);
      setAgents([]);
    }
  };

  const fetchData = async () => {
    try {
      // 1) disponibilités agents
      const dispoRes = await axios.get(`${API_BASE}/disponibilite/all`, authHeader);
      const disponibilites = (dispoRes.data || []).map((item) => {
        const nameFromIndex = agentIndex[String(item.agentId)]?.name;
        const title = nameFromIndex || item.agentName || `Agent ${item.agentId}`;
        return {
          title,
          start: item.start,
          end: item.end,
          backgroundColor: COLORS.dispo,
          borderColor: COLORS.dispo,
        };
      });

      // 2) RDV vue admin
      const rdvRes = await axios.get(`${API_BASE}/rendezvous/admin`, authHeader);
      const rdvs = (rdvRes.data || []).map((rdv) => {
        // back peut renvoyer start/end ou dateRdv + duree
        const start = rdv.start || rdv.dateRdv;
        const end =
          rdv.end ||
          (rdv.dateRdv && rdv.duree
            ? new Date(new Date(rdv.dateRdv).getTime() + rdv.duree * 60000)
            : undefined);

        let color = COLORS.attente;
        if (rdv.statut === "valide") color = COLORS.valide;
        else if (rdv.statut === "annule") color = COLORS.annule;

        const agentName =
          rdv?.agent?.partner?.name ||
          agentIndex[String(rdv?.agentId)]?.name ||
          (rdv?.agentId ? `Agent ${rdv.agentId}` : "Équipe");

        const clientName = rdv?.client?.partner?.name || "Client";
        const title =
          rdv.title ||
          (rdv.statut === "valide"
            ? `RDV confirmé: ${clientName} / ${agentName}`
            : `RDV: ${clientName} / ${agentName}`);

        return {
          id: rdv.id,
          title,
          start,
          end,
          backgroundColor: color,
          borderColor: color,
        };
      });

      setEvents([...disponibilites, ...rdvs]);
    } catch (err) {
      console.error("Erreur de chargement admin :", err);
    }
  };

  // Sélection d’un créneau → ouverture du dialog d’affectation
  const handleDateSelect = (selectInfo) => {
    setSelectedSlot({ startStr: selectInfo.startStr, endStr: selectInfo.endStr });
    setSelectedAgentId("");
    setAssignOpen(true);
  };

  // Confirmer l’affectation: envoi au back + MAJ optimiste avec NOM
  const confirmAssign = async () => {
    if (!selectedAgentId || !selectedSlot) return;

    try {
      await axios.post(
        AFFECT_URL,
        {
          agentId: selectedAgentId,
          start: selectedSlot.startStr,
          end: selectedSlot.endStr,
        },
        authHeader
      );

      const a = agentIndex[String(selectedAgentId)];
      // MAJ optimiste
      setEvents((prev) => [
        ...prev,
        {
          title: a?.name || `Agent ${selectedAgentId}`,
          start: selectedSlot.startStr,
          end: selectedSlot.endStr,
          backgroundColor: COLORS.dispo,
          borderColor: COLORS.dispo,
        },
      ]);

      setAssignOpen(false);
      setSelectedSlot(null);

      // puis re-fetch pour la vérité serveur
      await fetchData();
    } catch (err) {
      console.error("Erreur lors de l'affectation/ajout de disponibilité", err);
    }
  };

  return (
    <>
      {/* Légende */}
      <Box display="flex" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor={COLORS.dispo} borderRadius={1} />
          <Typography>Disponibilité Agent</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor={COLORS.valide} borderRadius={1} />
          <Typography>RDV Validé</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor={COLORS.attente} borderRadius={1} />
          <Typography>RDV en Attente</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor={COLORS.annule} borderRadius={1} />
          <Typography>RDV Annulé</Typography>
        </Box>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        selectable
        select={handleDateSelect}
        height="auto"
      />

      {/* Dialog d’affectation d’agent */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Affecter un agent au créneau sélectionné</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="agent-select-label">Agent</InputLabel>
            <Select
              labelId="agent-select-label"
              label="Agent"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              renderValue={(value) => {
                const a = agentIndex[String(value)];
                return a ? a.name : "";
              }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
            >
              {agents.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{a.name}</Typography>
                    {a.email && (
                      <Typography variant="caption" color="text.secondary">
                        {a.email}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
              {agents.length === 0 && <MenuItem disabled>Aucun agent disponible</MenuItem>}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={confirmAssign} disabled={!selectedAgentId}>
            Affecter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
