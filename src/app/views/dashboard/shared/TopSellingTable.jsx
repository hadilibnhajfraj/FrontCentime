import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import Avatar from "@mui/material/Avatar";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import IconButton from "@mui/material/IconButton";
import { styled, useTheme } from "@mui/material/styles";
import Edit from "@mui/icons-material/Edit";
import { Paragraph } from "app/components/Typography";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// STYLED COMPONENTS
const CardHeader = styled(Box)(() => ({
  display: "flex",
  paddingLeft: "24px",
  paddingRight: "24px",
  marginBottom: "12px",
  alignItems: "center",
  justifyContent: "space-between"
}));

const Title = styled("span")(() => ({
  fontSize: "1rem",
  fontWeight: "500",
  textTransform: "capitalize"
}));

const ProductTable = styled(Table)(() => ({
  minWidth: 400,
  whiteSpace: "pre",
  "& small": {
    width: 50,
    height: 15,
    borderRadius: 500,
    boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.12), 0 2px 2px 0 rgba(0, 0, 0, 0.24)"
  },
  "& td": { borderBottom: "none" },
  "& td:first-of-type": { paddingLeft: "16px !important" }
}));

const Small = styled("small")(({ bgcolor }) => ({
  width: 50,
  height: 15,
  color: "#fff",
  padding: "2px 8px",
  borderRadius: "4px",
  overflow: "hidden",
  background: bgcolor,
  boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.12), 0 2px 2px 0 rgba(0, 0, 0, 0.24)"
}));

export default function TopSellingTable() {
  const { palette } = useTheme();

  const bgActive = palette.success.main;
  const bgInactive = palette.error.main;
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/auth/summary")
      .then((res) => setUsers(res.data.users))
      .catch((err) => console.error(err));
  }, []);
  return (
    <Card elevation={3} sx={{ pt: "20px", mb: 3 }}>
      <CardHeader>
        <Title>Liste des Utilisateurs </Title>
      
      </CardHeader>

      <Box overflow="auto">
        <ProductTable>
          <TableHead>
            <TableRow>
              <TableCell colSpan={4} sx={{ px: 3 }}>
                Login
              </TableCell>

              <TableCell colSpan={2} sx={{ px: 0 }}>
                Email
              </TableCell>

              <TableCell colSpan={2} sx={{ px: 0 }}>
                Status
              </TableCell>

              <TableCell colSpan={1} sx={{ px: 0 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell colSpan={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>{user.login?.charAt(0).toUpperCase()}</Avatar>
                    <Paragraph>{user.login}</Paragraph>
                  </Box>
                </TableCell>

                <TableCell colSpan={3}>{user.email}</TableCell>

                <TableCell colSpan={2}>
                  <Small bgcolor={user.active ? bgActive : bgInactive}>
                    {user.active ? "Activé" : "Désactivé"}
                  </Small>
                </TableCell>

                <TableCell colSpan={1}>
                  <IconButton onClick={() => navigate(`/user-profile/${user.id}`)}>
                    <Edit color="primary" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ProductTable>
      </Box>
    </Card>
  );
}
