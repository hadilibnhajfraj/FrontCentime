import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid2";

import { styled } from "@mui/material/styles";
import Group from "@mui/icons-material/Group";

import ShoppingCart from "@mui/icons-material/ShoppingCart";

import { Small } from "app/components/Typography";
import { useEffect, useState } from "react";
import axios from "axios";
import Business from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import useAuth from "app/hooks/useAuth";

// STYLED COMPONENTS
const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "24px !important",
  background: theme.palette.background.paper,
  [theme.breakpoints.down("sm")]: { padding: "16px !important" }
}));

const ContentBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  "& small": { color: theme.palette.text.secondary },
  "& .icon": { opacity: 0.6, fontSize: "44px", color: theme.palette.primary.main }
}));

const Heading = styled("h6")(({ theme }) => ({
  margin: 0,
  marginTop: "4px",
  fontSize: "14px",
  fontWeight: "500",
  color: theme.palette.primary.main
}));

export default function StatCards() {
  const { role, user } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [dossierCount, setDossierCount] = useState(0);
  const [dossierCounts, setDossierCounts] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (role === "ADMIN") {
      axios
        .get("http://localhost:4000/api/auth/summary")
        .then((res) => setUserCount(res.data.totalUsers))
        .catch((err) => console.error("Erreur users:", err));
    }

    if (role === "ADMIN" || role === "AGENT") {
      axios
        .get("http://localhost:4000/departments/all", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => setDepartmentCount(res.data.length))
        .catch((err) => console.error("Erreur départements:", err));
    }

    if (role === "CLIENT" && user?.login) {
      // 🟢 Récupérer uniquement les dossiers de CE client
      axios
        .get(`http://localhost:4000/dossier/byClient`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => setDossierCounts(res.data.length))
        .catch((err) => console.error("Erreur dossiers client:", err));
    } else if (role === "ADMIN" || role === "AGENT") {
      // 🟢 Récupérer tous les dossiers
      axios
        .get("http://localhost:4000/dossier/prestations", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => setDossierCount(res.data.length))
        .catch((err) => console.error("Erreur dossiers:", err));
    }
  }, [role, user]);

  let cardList = [];

  if (role === "ADMIN") {
    cardList = [
      { name: "Utilisateurs", amount: userCount, Icon: Group },
      { name: "Départements", amount: `${departmentCount} Departments`, Icon: Business },
      { name: "Dossiers", amount: `${dossierCount} Dossiers`, Icon: DescriptionIcon },
      { name: "Orders to deliver", amount: "305 Orders", Icon: ShoppingCart }
    ];
  } else if (role === "AGENT") {
    cardList = [
      { name: "Dossiers", amount: `${dossierCount} Dossiers`, Icon: DescriptionIcon },
      { name: "Orders to deliver", amount: "305 Orders", Icon: ShoppingCart }
    ];
  } else if (role === "CLIENT") {
    cardList = [
      { name: "Mes Dossiers", amount: `${dossierCounts} Dossiers`, Icon: DescriptionIcon }
    ];
  }

  return (
    <Grid container spacing={3} sx={{ mb: "24px" }}>
      {cardList.map(({ amount, Icon, name }) => (
        <Grid size={{ md: 6, xs: 12 }} key={name}>
          <StyledCard elevation={6}>
            <ContentBox>
              <Icon className="icon" />
              <Box ml="12px">
                <Small>{name}</Small>
                <Heading>{amount}</Heading>
              </Box>
            </ContentBox>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );
}
