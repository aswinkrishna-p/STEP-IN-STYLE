//  <script>

//     // Function to show the "Add New Address" modal
//     function showAddNewAddressModal() {
//         $('#addNewAddressModal').modal('show');
//     }

//     // Function to hide the "Add New Address" modal
//     function hideAddNewAddressModal() {
//         $('#addNewAddressModal').modal('hide');
//     }

//     // Add click event listener to the "Add a New Address" link
//     document.getElementById('addNewAddressLink').addEventListener('click', showAddNewAddressModal);

//     // Function to handle form submission for adding a new address
//     function saveNewAddress() {
//         // Extract form data
//         const newAddressData = {
//             newFirstName: document.getElementById('newFirstName').value,
//             newLastName: document.getElementById('newLastName').value,
//             newStreetAddress: document.getElementById('newStreetAddress').value,
//             newPostcodeZip: document.getElementById('newPostcodeZip').value,
//             newTownCity: document.getElementById('newTownCity').value,
//             newState: document.getElementById('newState').value,
//             newDistrict: document.getElementById('newDistrict').value,
//             newPhone: document.getElementById('newPhone').value
//         };

//         // Send the data to the server using fetch
//         fetch('/add-address', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(newAddressData)
//         })
//         .then(response => response.json())
//         .then(data => {
//             // Handle the response from the server
//             if (data.success) {
//                 // Address added successfully, you can perform additional actions if needed
//                 console.log('Address added successfully');

//                 // Hide the modal after successful submission
//                 hideAddNewAddressModal();
//             } else {
//                 // Handle errors or display error messages to the user
//                 console.error('Error adding address:', data.message);
//             }
//         })
//         .catch(error => {
//             console.error('An error occurred:', error);
//         });
//     }

//     // Add click event listener to the "Save Address" button within the modal
//     document.getElementById('saveNewAddressBtn').addEventListener('click', saveNewAddress);


// </script> 