import { useState } from "react";
import { TableCell, TextField, Button, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// Reusable component for editing a numeric field
const EditableNumberCell = ({ order, field, value, updateField, width = "200px" } : any) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Copy helper if needed (assumes handleCopy is available globally or passed in)
  const handleCopy = (text : any) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdate = async () => {
    // Only update if the value has changed and is valid
    if (localValue !== "" && !isNaN(localValue)) {
      await updateField(order.id, field, parseFloat(localValue));
    }
    setEditing(false);
  };

  return (
    <TableCell sx={{ width }}>
      {editing ? (
        <>
          <TextField
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            style={{ width: "100px" }}
          />
          <Button variant="contained" onClick={handleUpdate} sx={{ ml: 1 }}>
            Update
          </Button>
        </>
      ) : (
        <>
          <span onClick={() => handleCopy(localValue.toString())}>
            {localValue === "0" || localValue === 0 ? "" : localValue}
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

export default EditableNumberCell;
