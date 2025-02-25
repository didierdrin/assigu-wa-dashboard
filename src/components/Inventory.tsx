import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, firestore as db, auth } from "../../firebaseApp";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface WhatsappInsuranceOrder {
  adminFee: number;
  carBodyType: string;
  carImageUrl: string;
  chassis: string;
  creationDate: any; // Firebase Timestamp
  expiryDate: string;
  insuranceDocumentUrl: string;
  insuranceStartDate: string;
  insurer: string;
  licensedToCarryNo: string;
  markAndType: string;
  nationalIdDocumentUrl: string;
  nationalIdNames: string;
  nationalIdNumber: string;
  netPremium: number;
  numberOfCoveredPeople: number;
  plateNumber: string;
  policyNo: string;
  policyholderName: string;
  selectedCoverTypes: string;
  selectedInstallment: string;
  selectedPersonalAccidentCoverage: number;
  sgf: number;
  totalCost: number;
  usage: string;
  userPhone: string;
  vat: number;
  yellowCardDocumentUrl: string;
}

type OrderWithId = {
  id: string;
  data: WhatsappInsuranceOrder;
};

const Library = () => {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithId | null>(null);
  const [loading, setLoading] = useState(false);

  // The upload form and related state have been left in for reference
  // but are not used in this example. You can remove them if not needed.
  const [newOrder, setNewOrder] = useState<Partial<WhatsappInsuranceOrder>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "whatsappInsuranceOrders"),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data() as WhatsappInsuranceOrder,
          }))
        );
      }
    );
    return () => unsubscribe();
  }, []);

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please sign in to add an order");
      return;
    }
    // You can add validations here if needed.
    setLoading(true);
    try {
      // Example: upload files and prepare your order data.
      // This example is kept minimal.
      const docRef = await addDoc(
        collection(db, "whatsappInsuranceOrders"),
        {
          ...newOrder,
          createdAt: serverTimestamp(),
        }
      );
      await updateDoc(docRef, { id: docRef.id });
      setNewOrder({});
    } catch (error) {
      console.error("Error adding order: ", error);
      alert("Failed to add order");
    }
    setLoading(false);
  };

  const handleDeleteOrder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteDoc(doc(db, "whatsappInsuranceOrders", id));
    } catch (error) {
      console.error("Error deleting order: ", error);
      alert("Failed to delete order");
    }
  };

  // Helper to format a Timestamp into a readable date/time string
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp.toDate());
  };

  // Copy the provided text (URL) to the clipboard
  const handleCopy = (text: string | undefined) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Client List</h3>

      {/* The upload form is optional. Uncomment if needed */}
      {/*
      <form onSubmit={handleAddOrder} className="mb-8 space-y-4">
        // ... your upload form fields here
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Add Order"}
        </button>
      </form>
      */}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Clients (Already used our service)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(({ id, data }) => (
            <div
              key={id}
              onClick={() => setSelectedOrder({ id, data })}
              className="border rounded-lg p-4 hover:shadow-md transition duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">
                  {data.policyholderName || "N/A"}
                </h4>
                <span className="font-medium text-green-600">
                  RWF {data.totalCost || "N/A"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Plate Number: {data.plateNumber || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                Insurer: {data.insurer || "N/A"}
              </p>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={(e) => handleDeleteOrder(id, e)}
                  className="text-red-500 hover:text-red-700 font-medium transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog: Detailed table view for a selected order */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Order Details #{selectedOrder?.data.policyNo || selectedOrder?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Full Name/ID</TableCell>
                  <TableCell>ID Number</TableCell>
                  <TableCell>Whatsapp Number</TableCell>
                  <TableCell>TIN</TableCell>
                  <TableCell>Plate Number</TableCell>
                  <TableCell>Make/Model</TableCell>
                  <TableCell>Chassis Number</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Licensed to Carry</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Current Insurer</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Cover</TableCell>
                  <TableCell>Personal Cover</TableCell>
                  <TableCell>Personal Accident Cover</TableCell>
                  <TableCell>Installments</TableCell>
                  <TableCell>Proforma</TableCell>
                  <TableCell>MOMO Name</TableCell>
                  <TableCell>Total Premium</TableCell>
                  <TableCell>PAID</TableCell>
                  <TableCell>Insurance Certificate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>
                    {selectedOrder.data.policyholderName || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.nationalIdNumber || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.userPhone || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.plateNumber || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.markAndType || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.chassis || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.creationDate
                      ? new Date(selectedOrder.data.creationDate.seconds * 1000).getFullYear()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.licensedToCarryNo || "N/A"}
                  </TableCell>
                  <TableCell>{selectedOrder.data.usage || "N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.insurer || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.insuranceStartDate || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.expiryDate || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.creationDate
                      ? formatDate(selectedOrder.data.creationDate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.creationDate
                      ? formatDate(selectedOrder.data.creationDate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.carBodyType || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.selectedCoverTypes || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.selectedPersonalAccidentCoverage ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.selectedInstallment || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.totalCost || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.insuranceDocumentUrl ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          handleCopy(selectedOrder.data.insuranceDocumentUrl)
                        }
                      >
                        Copy URL
                      </Button>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Library;



// import { useState, useEffect } from "react";
// import {
//   collection,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage, firestore as db, auth } from "../../firebaseApp";

// interface LicenseType {
//   type: string;
//   price: number;
//   rights: string[];
// }

// interface Beat {
//   title: string;
//   producerId: string;
//   producerName: string;
//   audioUrl: string;
//   previewUrl: string;
//   duration: number;
//   genre: string;
//   tags: string[];
//   bpm: number;
//   price: number;
//   licenseTypes: {
//     [key: string]: LicenseType;
//   };
//   plays: number;
//   purchases: number;
//   likes: number;
//   createdAt: any;
//   updatedAt: any;
//   imageUrl: string;
//   isActive: boolean;
//   isFeatured: boolean;
//   searchKeywords: string[];
// }

// type BeatWithId = {
//   id: string;
//   data: Beat;
// };

// const Library = () => {
//   const [beats, setBeats] = useState<BeatWithId[]>([]);
//   const [editingBeat, setEditingBeat] = useState<BeatWithId | null>(null);
//   const [audioFile, setAudioFile] = useState<File | null>(null);
//   const [previewFile, setPreviewFile] = useState<File | null>(null);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);

//   const [newBeat, setNewBeat] = useState<Partial<Beat>>({
//     title: "",
//     producerName: "", // Added producerName field
//     genre: "",
//     tags: [],
//     bpm: 0,
//     price: 0,
//     licenseTypes: {
//       basic: {
//         type: "Basic",
//         price: 0,
//         rights: [],
//       },
//     },
//     isActive: true,
//     isFeatured: false,
//     searchKeywords: [],
//   });

//   useEffect(() => {
//     const unsubscribe = onSnapshot(collection(db, "whatsappInsuranceOrders"), (snapshot) => {
//       setBeats(
//         snapshot.docs.map((doc) => ({
//           id: doc.id,
//           data: doc.data() as Beat,
//         }))
//       );
//     });
//     return () => unsubscribe();
//   }, []);

//   const uploadFile = async (file: File, path: string) => {
//     const storageRef = ref(storage, path);
//     await uploadBytes(storageRef, file);
//     return getDownloadURL(storageRef);
//   };

//   const handleAddBeat = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!auth.currentUser) {
//       alert("Please sign in to upload beats");
//       return;
//     }

//     if (!audioFile || !newBeat.title || !newBeat.genre || !newBeat.producerName) {
//       alert("Please fill in all required fields and upload an audio file");
//       return;
//     }

//     setLoading(true);
//     try {
//       // Upload files
//       const audioUrl = await uploadFile(audioFile, `beats/${auth.currentUser.uid}/${Date.now()}-full.mp3`);
//       const previewUrl = previewFile
//         ? await uploadFile(previewFile, `beats/${auth.currentUser.uid}/${Date.now()}-preview.mp3`)
//         : audioUrl;
//       const imageUrl = imageFile
//         ? await uploadFile(imageFile, `beats/${auth.currentUser.uid}/${Date.now()}-cover.jpg`)
//         : "";

//       // Create searchKeywords
//       const searchKeywords = [
//         newBeat.title?.toLowerCase(),
//         newBeat.genre?.toLowerCase(),
//         newBeat.producerName?.toLowerCase(),
//         ...(newBeat.tags?.map((tag) => tag.toLowerCase()) || []),
//       ].filter(Boolean);

//       // Add document to Firestore
//       const docRef = await addDoc(collection(db, "whatsappInsuranceOrders"), {
//         ...newBeat,
//         producerId: auth.currentUser.uid,
//         producerName: newBeat.producerName, // Use producerName from the form
//         audioUrl,
//         previewUrl,
//         imageUrl,
//         duration: 0, // You might want to calculate this using audio metadata
//         plays: 0,
//         purchases: 0,
//         likes: 0,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         searchKeywords,
//       });

//       // Update the document to include the generated ID
//       await updateDoc(docRef, { id: docRef.id });

//       // Reset form
//       setNewBeat({
//         title: "",
//         producerName: "",
//         genre: "",
//         tags: [],
//         bpm: 0,
//         price: 0,
//         licenseTypes: {
//           basic: {
//             type: "Basic",
//             price: 0,
//             rights: [],
//           },
//         },
//         isActive: true,
//         isFeatured: false,
//         searchKeywords: [],
//       });
//       setAudioFile(null);
//       setPreviewFile(null);
//       setImageFile(null);
//     } catch (error) {
//       console.error("Error adding beat: ", error);
//       alert("Failed to add beat");
//     }
//     setLoading(false);
//   };

//   const handleDeleteBeat = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this beat?")) return;

//     try {
//       await deleteDoc(doc(db, "beats", id));
//     } catch (error) {
//       console.error("Error deleting beat: ", error);
//       alert("Failed to delete beat");
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h3 className="text-xl font-semibold mb-4">Client List</h3>

//       {/* <form onSubmit={handleAddBeat} className="mb-8 space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input
//             type="text"
//             placeholder="Beat Title"
//             value={newBeat.title}
//             onChange={(e) => setNewBeat({ ...newBeat, title: e.target.value })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="text"
//             placeholder="Producer Name"
//             value={newBeat.producerName}
//             onChange={(e) => setNewBeat({ ...newBeat, producerName: e.target.value })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="text"
//             placeholder="Genre"
//             value={newBeat.genre}
//             onChange={(e) => setNewBeat({ ...newBeat, genre: e.target.value })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="number"
//             placeholder="BPM"
//             value={newBeat.bpm || ""}
//             onChange={(e) => setNewBeat({ ...newBeat, bpm: parseInt(e.target.value) })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="number"
//             placeholder="Price (USD)"
//             value={newBeat.price || ""}
//             onChange={(e) => setNewBeat({ ...newBeat, price: parseFloat(e.target.value) })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="space-y-2">
//           <input
//             type="text"
//             placeholder="Tags (comma-separated)"
//             onChange={(e) =>
//               setNewBeat({
//                 ...newBeat,
//                 tags: e.target.value.split(",").map((tag) => tag.trim()),
//               })
//             }
//             className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="space-y-2">
//           <div>
//             <label className="block text-sm font-medium mb-1">Full Beat Audio</label>
//             <input
//               type="file"
//               accept="audio/*"
//               onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
//               className="w-full"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Preview Audio (optional)</label>
//             <input
//               type="file"
//               accept="audio/*"
//               onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
//               className="w-full"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Cover Image (optional)</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) => setImageFile(e.target.files?.[0] || null)}
//               className="w-full"
//             />
//           </div>
//         </div>

//         <div className="flex items-center space-x-4">
//           <label className="flex items-center">
//             <input
//               type="checkbox"
//               checked={newBeat.isActive}
//               onChange={(e) => setNewBeat({ ...newBeat, isActive: e.target.checked })}
//               className="mr-2"
//             />
//             Active
//           </label>
//           <label className="flex items-center">
//             <input
//               type="checkbox"
//               checked={newBeat.isFeatured}
//               onChange={(e) => setNewBeat({ ...newBeat, isFeatured: e.target.checked })}
//               className="mr-2"
//             />
//             Featured
//           </label>
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-200 disabled:opacity-50"
//         >
//           {loading ? "Uploading..." : "Upload Beat"}
//         </button>
//       </form> */}

//       <div className="mb-6">
//         <h3 className="text-lg font-medium mb-4">Client(Already used our service)</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {beats.map(({ id, data }) => (
//             <div
//               key={id}
//               className="border rounded-lg p-4 hover:shadow-md transition duration-200"
//             >
//               <div className="flex justify-between items-start mb-3">
//                 <h4 className="font-semibold text-lg">{data.title}</h4>
//                 <span className="font-medium text-green-600">${data.price}</span>
//               </div>
//               <p className="text-sm text-gray-600">Full Name: {data.genre}</p>
//               <p className="text-sm text-gray-600">Insurance_active: {data.bpm}</p>
//               <div className="flex justify-end space-x-3 mt-4">
//                 <button
//                   onClick={() => handleDeleteBeat(id)}
//                   className="text-red-500 hover:text-red-700 font-medium transition duration-200"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Library;

