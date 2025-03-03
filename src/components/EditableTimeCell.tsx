// EditableTimeCell.jsx
import { useState } from "react";
import { TableCell, TextField, Button } from "@mui/material";

const EditableTimeCell = ({ order, field, value, updateField, width = "200px" } : any) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || "");

  const handleCopy = (text : any) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdate = async () => {
    await updateField(order.id, field, localValue);
    setEditing(false);
  };

  return (
    <TableCell sx={{ width }}>
      {editing ? (
        <>
          <TextField
            type="time"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            style={{ width: "150px" }}
          />
          <Button variant="contained" onClick={handleUpdate} sx={{ ml: 1 }}>
            Update
          </Button>
        </>
      ) : (
        <>
          <span onClick={() => handleCopy(localValue)}>
            {localValue || ""}
          </span>
          <Button
            variant="outlined"
            onClick={() => setEditing(true)}
            sx={{ ml: 1 }}
          >
            Edit
          </Button>
        </>
      )}
    </TableCell>
  );
};

export default EditableTimeCell;