// EditablePaymentCell.jsx
import { useState } from "react";
import { TableCell, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";

const EditablePaymentCell = ({ order, updateField, width = "200px" } : any) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(order.paidBool ? "Paid" : "No");

  const handleCopy = (text : any) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdate = async () => {
    // Convert to boolean
    const newValue = localValue === "Paid";
    
    // Update the field
    await updateField(order.id, "paidBool", newValue);
    
    // If changed to "Paid", trigger the WhatsApp notification
    if (newValue) {
      // Get the phone number
      const phone = order.userPhone ? 
        (order.userPhone.startsWith('+') ? order.userPhone.substring(1) : order.userPhone) 
        : null;
        
      if (phone) {
        // Call your API endpoint to send the payment received message
        fetch("https://assigurwmessaging.onrender.com/api/send-payment-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            phone: phone
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Show success notification if needed
            console.log("Payment confirmation sent successfully");
          } else {
            console.error("Failed to send payment confirmation");
          }
        })
        .catch(error => {
          console.error("Error sending payment confirmation:", error);
        });
      }
    }
    
    setEditing(false);
  };

  return (
    <TableCell sx={{ width }}>
      {editing ? (
        <>
          <FormControl style={{ width: "100px" }}>
            <InputLabel>Payment</InputLabel>
            <Select
              value={localValue}
              label="Payment"
              onChange={(e) => setLocalValue(e.target.value)}
            >
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleUpdate} sx={{ ml: 1 }}>
            Update
          </Button>
        </>
      ) : (
        <>
          <span onClick={() => handleCopy(order.paidBool ? "Paid" : "No")}>
            {order.paidBool ? "Paid" : "No"}
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

export default EditablePaymentCell;