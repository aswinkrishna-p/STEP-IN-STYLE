


function addToWishlist(productId) {
    fetch(`/add-to-wishlist/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        if (response.ok) {
          console.log("Product added to wishlist.");
        } else {
          console.error("Error adding product to wishlist. Status:", response.status);
        }
      })
      .catch(function (error) {
        console.error("Network error:", error);
      });

      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Added to Wishlist',
        showConfirmButton: false,
        timer: 1500
      });
  }



  function addtoCart(id) {
    const price = document.querySelector(`#price${id}`).value;
  console.log('priceeeeeeeeee',price);
    const data = {
      productid: id,
      size: 1,
      price: price,
    };
  
    fetch(`/addtocart/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Set the correct content type
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        console.log(response);
        if (response.ok) {
          return response.json(); // Parse the JSON response
        } else {
          throw new Error('Failed to add product to cart');
        }
      })
      .then((data) => {
       
        // window.location.reload();
      })
      .catch((error) => {
        console.error('Error adding product to cart:', error);
      });
  
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Added to Cart',
        showConfirmButton: false,
        timer: 1500
      });
  }

// JavaScript (script.js)

// const editProfileBtn = document.getElementById('editProfileBtn');
// const updateProfileBtn = document.getElementById('updateProfileBtn');
// const formFields = document.querySelectorAll('.form-control');

// editProfileBtn.addEventListener('click', function () {
//     // Toggle the fields' disabled state
//     formFields.forEach(field => {
//         field.disabled = !field.disabled;
//     });

//     // Toggle the visibility of buttons
//     editProfileBtn.style.display = 'none';
//     updateProfileBtn.style.display = 'block';
// });
