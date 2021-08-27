$("#create-form").validate({
    errorElement: 'div',
    rules: {
        product_name: "required",
        price: {
            required: true,
            number: true
        },
        upCountry: "required",
        inputImage: "required"
    },

    messages: {
        product_name: "Please enter product name!",
        price: {
            required: "Please input price of product!",
            number: "Please input only number!"
        },
        upCountry: "Please choose product category!",
        inputImage: "Please choose product image!"
    },

    submitHandler: function(form) {
        form.submit();
    }
});
