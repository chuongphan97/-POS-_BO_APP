let socket = io();

function getUser(){
    if (parseJwt(getCookie("JWT")).user.authorities[0] !== "STAFF") {
        window.location.href = "http://localhost:5000/403"
    } else if (parseJwt(getCookie("JWT")).user.authorities[0] === "STAFF"){
        let user = parseJwt(getCookie("JWT")).user;
        $("#user").html(`${user.username}`);
        $("#username-hidden").val(user.username);
        socket.emit("logging", user.username)
        socket.emit("create-room", "selectSeat");
    } else  {
    window.location.href = "http://localhost:5000/";
   }
}

function logout(){
    deleteCookie("JWT");
    window.location.href = "http://localhost:5000/";
}

function deleteCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

let order = {
    total_price: 0,
    order_time: 0,
    order_date: 0,
    total_product: 0,
    total_ticket: 0,
    products: [],
    ticket: [],
    member: "",
    user:""
};

function getSchedules(){
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/schedules/allSchedule"
    }).done((schedules) => {
        let content = ``;
        for (let i = 0; i < schedules.length ; i++) {
            let d1 = Date.parse(schedules[i].schedule_date);
            let d2 = Date.parse(App.getToday());
            if (d1 === d2){
                content += `
                <option value="${schedules[i].schedule_id}" selected>${schedules[i].schedule_date}</option>
            `;
            } else {
                content += `
                <option value="${schedules[i].schedule_id}">${schedules[i].schedule_date}</option>
            `;
            }
        }
        $("#schedule").html(content);
        $("#schedule").on("change",() => {
            let id = $("#schedule option:selected").attr('value');
            getShows(id)
        })
        getCurrentShow();
    })
}

function getShows(scheduleId){
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/schedules/${scheduleId}`
    }).done((schedule) =>{
        if (schedule.schedule_date === App.getToday()){
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/allActiveShowsToday/${schedule.schedule_id}`
            }).done((shows) => {
                let content =``;
                for (let i = 0; i < shows.length; i++) {
                    content += `
                        <div class="col-md-4 mb-3" >
                            <div class="rounded card h-40 text-dark" >
                                <div class="d-flex flex-column h-70 p-2 pb-3 text-shadow-1">
                                    <div class="mb-1">
                                        <h4 class="fw-bold" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${shows[i].film.film_name}
                                  
                                        </h4>
                                        <p class="text-muted">${schedule.schedule_date} ${shows[i].time_start}</p>
                                        <p class="badge ${(shows[i].status) ? 'bg-success text-white' : 'bg-danger text-white'}">${shows[i].status ? 'ACTIVE' : 'IN-ACTIVE'}</p>
                                    </div>
                                    <ul class="d-flex list-unstyled mt-3">
                                        <li class="me-auto">
                                            <button class="btn btn-outline-warning showSeats" value="${shows[i].room.room_id}"><i class="fas fa-plus"></i></button></li>

                                        <li class="d-flex align-items-center">
                                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                                            <span id="admit${shows[i].room.room_id}" class="admit" value="${shows[i].room.room_id}"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }
                $("#menuProduct").html(content);
                $(".showSeats").on("click", function (){
                    let roomId = $(this).val();
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/show/findShowByRoomId/${roomId}`
                    }).done((show) => {
                        if (show.status) {
                            showListSeats(roomId);
                        } else {
                            showListSeatsFromInActiveShow(roomId);
                        }
                    })

                })
                for (let i =0; i < shows.length; i++){
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
                    }).done((seats) =>{
                        $(`#admit${shows[i].room.room_id}`).html(`
                            <p>${App.countTakenSeat(seats)}/100</p>
                        `)
                    })
                }
            })
        }
        else {
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/allShows/${schedule.schedule_id}`
            }).done((shows) => {
                let content =``;
                for (let i = 0; i < shows.length; i++) {
                    content += `
                        <div class="col-md-4 mb-3" >
                            <div class="rounded card h-40 text-dark" >
                                <div class="d-flex flex-column h-70 p-2 pb-3 text-shadow-1">
                                    <div class="mb-1">
                                        <h4 class="fw-bold" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${shows[i].film.film_name}
                                  
                                        </h4>
                                        <p class="text-muted">${schedule.schedule_date} ${shows[i].time_start}</p>
                                        <p class="badge ${(shows[i].status) ? 'bg-success text-white' : 'bg-danger text-white'}">${shows[i].status ? 'ACTIVE' : 'IN-ACTIVE'}</p>
                                    </div>
                                    <ul class="d-flex list-unstyled mt-3">
                                        <li class="me-auto">
                                            <button class="btn btn-outline-warning showSeats" value="${shows[i].room.room_id}"><i class="fas fa-plus"></i></button></li>

                                        <li class="d-flex align-items-center">
                                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                                            <span id="admit${shows[i].room.room_id}" class="admit" value="${shows[i].room.room_id}"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }
                $("#menuProduct").html(content);
                $(".showSeats").on("click", function (){
                    let roomId = $(this).val();
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/show/findShowByRoomId/${roomId}`
                    }).done((show) => {
                        if (show.status) {
                            showListSeats(roomId);
                        } else {
                            showListSeatsFromInActiveShow(roomId);
                        }
                    })
                })
                for (let i =0; i < shows.length; i++){
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
                    }).done((seats) =>{
                        $(`#admit${shows[i].room.room_id}`).html(`
                            <p>${App.countTakenSeat(seats)}/100</p>
                        `)
                    })
                }
            })
        }
    })
}

function getCurrentShow(){
    let id = $("#schedule option:selected").attr('value');
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/schedules/${id}`
    }).done((schedule) =>{
        if (schedule.schedule_date === App.getToday()){
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/allActiveShowsToday/${schedule.schedule_id}`
            }).done((shows) => {
                let content =``;
                for (let i = 0; i < shows.length; i++) {
                    content += `
                        <div class="col-md-4 mb-3" >
                            <div class="rounded card h-40 text-dark" >
                                <div class="d-flex flex-column h-70 p-2 pb-3 text-shadow-1">
                                    <div class="mb-1">
                                        <h4 class="fw-bold" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${shows[i].film.film_name}</h4>
                                        <p class="text-muted">${schedule.schedule_date} ${shows[i].time_start}</p>
                                        <p class="badge ${(shows[i].status) ? 'bg-success text-white' : 'bg-danger text-white'}">${shows[i].status ? 'ACTIVE' : 'IN-ACTIVE'}</p>   
                                    </div>
                                    <ul class="d-flex list-unstyled mt-3">
                                        <li class="me-auto">
                                            <button class="btn btn-outline-warning showSeats" value="${shows[i].room.room_id}"><i class="fas fa-plus"></i></button></li>

                                        <li class="d-flex align-items-center">
                                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                                            <span id="admit${shows[i].room.room_id}" class="admit" value="${shows[i].room.room_id}"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }
                $("#menuProduct").html(content);
                $(".showSeats").on("click", function (){
                    let roomId = $(this).val();
                    showListSeats(roomId);
                })
                for (let i =0; i < shows.length; i++){
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
                    }).done((seats) =>{
                        $(`#admit${shows[i].room.room_id}`).html(`
                            <p>${App.countTakenSeat(seats)}/100</p>
                        `)
                    })
                }
                checkChoosingSeat();
            })
        }
        else {
            console.log("askldjklasjdlksdjdskl")
            
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/allShows/${schedule.schedule_id}`
            }).done((shows) => {
                let content =``;
                for (let i = 0; i < shows.length; i++) {
                    content += `
                        <div class="col-md-4 mb-3" >
                            <div class="rounded card h-40 text-dark" >
                                <div class="d-flex flex-column h-70 p-2 pb-3 text-shadow-1">
                                    <div class="mb-1">
                                        <h4 class="fw-bold" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${shows[i].film.film_name}</h4>
                                        <p class="text-muted">${schedule.schedule_date} ${shows[i].time_start}</p>
                                        <p class="badge ${(shows[i].status) ? 'bg-success text-white' : 'bg-danger text-white'}">${shows[i].status ? 'ACTIVE' : 'IN-ACTIVE'}</p>   
                                    </div>
                                    <ul class="d-flex list-unstyled mt-3">
                                        <li class="me-auto">
                                            <button class="btn btn-outline-warning showSeats" value="${shows[i].room.room_id}"><i class="fas fa-plus"></i></button></li>

                                        <li class="d-flex align-items-center">
                                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                                            <span id="admit${shows[i].room.room_id}" class="admit" value="${shows[i].room.room_id}"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }
                $("#menuProduct").html(content);
                $(".showSeats").on("click", function (){
                    let roomId = $(this).val();
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/show/findShowByRoomId/${roomId}`
                    }).done((show) => {
                        if (show.status) {
                            showListSeats(roomId);
                        } else {
                            showListSeatsFromInActiveShow(roomId);
                        }
                    })
                })
                for (let i =0; i < shows.length; i++){
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
                    }).done((seats) =>{
                        $(`#admit${shows[i].room.room_id}`).html(`
                            <p>${App.countTakenSeat(seats)}/100</p>
                        `)
                    })
                }
            })
        }
    })
}

function searchFilmName(){
    let schedule_id = $("#schedule").val();
    let film_name = $("#searchFilmName").val();

    $.ajax({
        type: "GET",
        url: `http://localhost:8080/show/searchShow/${schedule_id}/${film_name}`
    }).done((shows) => {
        let content ="";
        for (let i = 0; i < shows.length; i++) {
            content += `
                        <div class="col-md-4 mb-3" >
                            <div class="rounded card h-40 text-dark" >
                                <div class="d-flex flex-column h-70 p-2 pb-3 text-shadow-1">
                                    <div class="mb-1">
                                        <h4 class="fw-bold" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${shows[i].film.film_name}
                                  
                                        </h4>
                                        <p class="text-muted">${shows[i].schedule.schedule_date} ${shows[i].time_start}</p>
                                        <p class="badge ${(shows[i].status) ? 'bg-success text-white' : 'bg-danger text-white'}">${shows[i].status ? 'ACTIVE' : 'IN-ACTIVE'}</p>
                                    </div>
                                    <ul class="d-flex list-unstyled mt-3">
                                        <li class="me-auto">
                                            <button class="btn btn-outline-warning showSeats" value="${shows[i].room.room_id}"><i class="fas fa-plus"></i></button></li>

                                        <li class="d-flex align-items-center">
                                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                                            <span id="admit${shows[i].room.room_id}" class="admit" value="${shows[i].room.room_id}"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
        }
        $("#menuProduct").html(content);
        $(".showSeats").on("click", function (){
            let roomId = $(this).val();
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/findShowByRoomId/${roomId}`
            }).done((show) => {
                if (show.status) {
                    showListSeats(roomId);
                } else {
                    showListSeatsFromInActiveShow(roomId);
                }
            })
        })
        for (let i =0; i < shows.length; i++){
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
            }).done((seats) =>{
                $(`#admit${shows[i].room.room_id}`).html(`
                            <p>${App.countTakenSeat(seats)}/100</p>
                        `)
            })
        }
    })
}

function showListSeatsFromInActiveShow(roomId){
    let username = $("#username-hidden").val();
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/seat/getSeatsByRoom/${roomId}`
    }).done((seats) => {
        let content = ` <div class="modal-header">
                <h5 class="modal-title" id="room-name">${seats[0].room.room_name}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <table class="d-flex justify-content-center">
                    <thead class="justify-content-center">
                        <h2 class="text-center">Màn hình</h2>
                    </thead>
                    <tbody >
                        <tr>`;

        for (let i = 1; i <= seats.length; i++) {
            if (seats[i-1].user.username === username){
                if (i === 100){
                    content += `<td value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 3) ? 'seat-view' : 'seat'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : ((seats[i-1].seatStatus.id === 2) ? 'btn-success' : 'btn-danger')} m-2">${seats[i-1].seat_name}</td>
                        </tr>`
                }
                else if (i % 10 === 0){
                    content += `<td value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 3) ? 'seat-view' : 'seat'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : ((seats[i-1].seatStatus.id === 2) ? 'btn-success' : 'btn-danger')} m-2">${seats[i-1].seat_name}</td>
                        </tr>
                        <tr>`
                } else {
                    content += `<td value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 3) ? 'seat-view' : 'seat'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : ((seats[i-1].seatStatus.id === 2) ? 'btn-success' : 'btn-danger')} m-2">${seats[i-1].seat_name}</td>`
                }
            } else {
                if (i === 100){
                    content += `<td value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 1) ? 'seat' : 'seat-view'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : 'btn-danger'} m-2">${seats[i-1].seat_name}</td>
                        </tr>`
                }
                else if (i % 10 === 0){
                    content += `<td value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 1) ? 'seat' : 'seat-view'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : 'btn-danger'} m-2">${seats[i-1].seat_name}</td>
                        </tr>
                        <tr>`
                } else {
                    content += `<td value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 1) ? 'seat' : 'seat-view'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : 'btn-danger'} m-2">${seats[i-1].seat_name}</td>`
                }
            }


        }
        content += `</tbody>
                </table>
            </div>
            <div class="modal-footer d-flex justify-content-between">
                <div class="">
                    <button class=" btn btn-success" style="width: 150px">Ghế đang chọn</button>
                    <button class=" btn btn-light" style="width: 150px">Ghế trống</button>
                    <button class=" btn btn-danger" style="width: 150px">Ghế đã chọn</button>
                </div>
                <button type="button" class="btn btn-secondary dismiss-modal" data-bs-dismiss="modal">Đóng</button>
            </div>` ;
        $("#seatsModal .modal-content").html(content);
        $("#seatsModal").modal("show");
        $(".seat").on("click", function (){
            App.showErrorAlert("Xuất chiếu đã hết giờ mua vé!")
        })
    })
}

function showListSeats(roomId){
    let username = $("#username-hidden").val();
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/seat/getSeatsByRoom/${roomId}`
    }).done((seats) => {
        let content = ` <div class="modal-header">
                <h5 class="modal-title" id="room-name">${seats[0].room.room_name}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <table class="d-flex justify-content-center">
                    <thead class="justify-content-center">
                        <h2 class="text-center">Màn hình</h2>
                    </thead>
                    <tbody >
                        <tr>`;

        for (let i = 1; i <= seats.length; i++) {
            if (seats[i-1].user.username === username){
                if (i === 100){
                    content += `<td id="s_${seats[i-1].seat_id}" data-seat-status="${seats[i-1].seatStatus.id}" value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 3) ? 'seat-view' : 'seat'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : ((seats[i-1].seatStatus.id === 2) ? 'btn-success' : 'btn-danger')} m-2">${seats[i-1].seat_name}</td>
                        </tr>`
                }
                else if (i % 10 === 0){
                    content += `<td id="s_${seats[i-1].seat_id}" data-seat-status="${seats[i-1].seatStatus.id}" value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 3) ? 'seat-view' : 'seat'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : ((seats[i-1].seatStatus.id === 2) ? 'btn-success' : 'btn-danger')} m-2">${seats[i-1].seat_name}</td>
                        </tr>
                        <tr>`
                } else {
                    content += `<td id="s_${seats[i-1].seat_id}" data-seat-status="${seats[i-1].seatStatus.id}" value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 3) ? 'seat-view' : 'seat'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : ((seats[i-1].seatStatus.id === 2) ? 'btn-success' : 'btn-danger')} m-2">${seats[i-1].seat_name}</td>`
                }
            } else {
                if (i === 100){
                    content += `<td id="s_${seats[i-1].seat_id}" data-seat-status="${seats[i-1].seatStatus.id}" value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 1) ? 'seat' : 'seat-view'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : 'btn-danger'} m-2">${seats[i-1].seat_name}</td>
                        </tr>`
                }
                else if (i % 10 === 0){
                    content += `<td id="s_${seats[i-1].seat_id}" data-seat-status="${seats[i-1].seatStatus.id}" value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 1) ? 'seat' : 'seat-view'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : 'btn-danger'} m-2">${seats[i-1].seat_name}</td>
                        </tr>
                        <tr>`
                } else {
                    content += `<td id="s_${seats[i-1].seat_id}" data-seat-status="${seats[i-1].seatStatus.id}" value="${seats[i-1].seat_id}" class="${(seats[i-1].seatStatus.id === 1) ? 'seat' : 'seat-view'} btn ${(seats[i-1].seatStatus.id === 1) ? 'btn-light' : 'btn-danger'} m-2">${seats[i-1].seat_name}</td>`
                }
            }


        }
        content += `</tbody>
                </table>
            </div>
            <div class="modal-footer d-flex justify-content-between">
                <div class="">
                    <button class=" btn btn-success" style="width: 150px">Ghế đang chọn</button>
                    <button class=" btn btn-light" style="width: 150px">Ghế trống</button>
                    <button class=" btn btn-danger" style="width: 150px">Ghế đã chọn</button>
                </div>
                <button type="button" class="btn btn-secondary dismiss-modal" data-bs-dismiss="modal">Đóng</button>
            </div>` ;
        $("#seatsModal .modal-content").html(content);
        $("#seatsModal").modal("show");

        $(".seat").on("click",function() {
            if ($(this).hasClass("seat")){
                let id = $(this).attr("value");
                socket.emit("clientRequests", id, $("#username-hidden").val());
            }
        })
    })
}



function selectSeat(seatId){
    let username = $("#username-hidden").val();
    $.ajax({
        type: "PUT",
        url: `http://localhost:8080/seat/selectSeatById/${seatId}/${username}`
    }).done((seat) => {
        socket.emit("client", seat)
        showListSeats(seat.room.room_id);
        if (seat.seatStatus.id === 2){
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/findShowByRoomId/${seat.room.room_id}`
            }).done((show) => {
                let newTicket = {
                    seat: seat,
                    show: show
                }
                order.ticket.push(newTicket);
                drawOrder();
            })
        }
        if (seat.seatStatus.id === 1){
            deleteTicketFromOrder(seat.seat_id);
        }
    })
}

function deleteTicketFromOrder(seatId){
    $.ajax({
        type: "PUT",
        url: `http://localhost:8080/seat/setEmpty/${seatId}`
    }).done((seat) => {
        for (let i = 0; i < order.ticket.length; i++) {
            if (order.ticket[i].seat.seat_id === seat.seat_id){
                order.ticket.splice(i,1);
            }
        }
        drawOrder();
    })
}

function checkChoosingSeat(){
    let schedule_id = $("#schedule").val();
    let username = $("#username-hidden").val();
    socket.emit("clearChoosingSeat", schedule_id, username);
}

//Quầy vé
function getScheduleOfTicket(){
    let content = `
    <li class="nav-item searchFilm" id="">
                    <select class="nav-link fw-bold" name="schedule" id="schedule">

                    </select>

                  </li>
                  <li class="nav-item">
                    <div class="input-group">
                      <input type="text" class="form-control" id="searchFilmName" placeholder="Tìm kiếm...">
                      <div class="input-group-append">
                        <button class="btn searchSchedule">
                          <i class="fas fa-search"></i>
                        </button>
                      </div>
                    </div>
                  </li>`;
    getScheduleChangeTab();
    $(".allItemProduct").html(content);
    $("#searchFilmName").on("input", function (){
        if ($("#searchFilmName").val() === ""){
            getCurrentShow();
        } else {
            searchFilmName();
        }
    })
}

function getScheduleChangeTab(){
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/schedules/allSchedule"
    }).done(function (schedules) {
        let content = ``;
        for (let i = 0; i < schedules.length ; i++) {
            let d1 = Date.parse(schedules[i].schedule_date);
            let d2 = Date.parse(App.getToday());
            if (d1 === d2){
                content += `
                <option value="${schedules[i].schedule_id}" selected>${schedules[i].schedule_date}</option>
            `;
            } else {
                content += `
                <option value="${schedules[i].schedule_id}">${schedules[i].schedule_date}</option>
            `;
            }
        }
        $("#schedule").html(content);
        $("#schedule").on("change",function (){
            let id = $("#schedule option:selected").attr('value');
            getShows(id)
        })
        getCurrentShowChangeTab();
    })
}

function getCurrentShowChangeTab(){
    let id = $("#schedule").val();
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/schedules/${id}`
    }).done((schedule) =>{
        if (schedule.schedule_date === App.getToday()){
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/allActiveShowsToday/${schedule.schedule_id}`
            }).done((shows) => {
                let content =``;
                for (let i = 0; i < shows.length; i++) {
                    content += `
                        <div class="col-md-4 mb-3" >
                            <div class="rounded card h-40 text-dark" >
                                <div class="d-flex flex-column h-70 p-2 pb-3 text-shadow-1">
                                    <div class="mb-1">
                                        <h4 class="fw-bold" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${shows[i].film.film_name}</h4>
                                        <p class="text-muted">${schedule.schedule_date} ${shows[i].time_start}</p>
                                        <p class="badge ${(shows[i].status) ? 'bg-success text-white' : 'bg-danger text-white'}">${shows[i].status ? 'ACTIVE' : 'IN-ACTIVE'}</p>   
                                    </div>
                                    <ul class="d-flex list-unstyled mt-3">
                                        <li class="me-auto">
                                            <button class="btn btn-outline-warning showSeats" value="${shows[i].room.room_id}"><i class="fas fa-plus"></i></button></li>

                                        <li class="d-flex align-items-center">
                                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                                            <span id="admit${shows[i].room.room_id}" class="admit" value="${shows[i].room.room_id}"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }
                $("#menuProduct").html(content);
                $(".showSeats").on("click", function (){
                    let roomId = $(this).val();
                    showListSeats(roomId);
                })
                for (let i =0; i < shows.length; i++){
                    $.ajax({
                        type: "GET",
                        url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
                    }).done((seats) =>{
                        $(`#admit${shows[i].room.room_id}`).html(`
                            <p>${App.countTakenSeat(seats)}/100</p>
                        `)
                    })
                }
            })
        }
    })
}

//Quầy đồ uống
function allItems(){
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/app/allProduct"
    }).done(function (product){
        let content = "";
        for (let i = 0; i < product.length ; i++) {
            content += `
                  <div class="col-md-4 mb-5" >
                    <div class="rounded card h-40 text-dark" >
                      <div class="d-flex flex-column h-80 p-2 pb-3 text-shadow-1">
                        <div class="mb-1">
                          <h4 class="fw-bold"  style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${product[i].product_name}</h4>
                          <p class="text-muted" >${product[i].category.category_name}</p>
                        </div>
                        <ul class="d-flex list-unstyled mt-3">
                          <li class="me-auto">
                            <button class="btn btn-outline-warning addToProduct" value="${product[i].product_id}"><i class="fas fa-plus "></i></button></li>
                          <li class="d-flex align-items-center">
                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                            <strong><small >${product[i].price.toLocaleString('vi', {style : 'currency', currency : 'VND'})}</small></strong>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>`;
            $('#menuProduct').html(content);
            $(".addToProduct").on("click",function (){
                let id = $(this).attr("value");
                getProduct(id);
            })
        }
    })
}

function getAllCategory(){
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/app/allCategory"
    }).done(function (category){
        let content = `<li class="nav-item">
                           <a class="nav-link btn-outline-warning fw-bold allListProduct" aria-current="page" href="#" >Tất cả</a>
                        </li>`;
        for (let i = 0; i < category.length; i++) {
            content += `
                    <li class="nav-item">
                    <a class="nav-link btn-outline-warning fw-bold searchByCategoryId" href="#" value="${category[i].category_id}">${category[i].category_name}</a>
                  </li>
                `;
        }
        $(".allItemProduct").html(content);
        $(".allListProduct").on("click",allItems);
        $(".searchByCategoryId").on("click",function (){
            let id = $(this).attr("value");
            searchProductByCategoryId(id);
        })
    }).fail(()=>{
        App.showErrorAlert("Đã xảy ra lỗi!");
    })
}

function searchProductByCategoryId(id){
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/app/menuProductByCategory/${id}`
    }).done(function (product){
        console.log(product)
        let content = "";
        for (let i = 0; i < product.length ; i++) {
            content += `
                  <div class="col-md-4 mb-5" >
                    <div class="rounded card h-40 text-dark" >
                      <div class="d-flex flex-column h-80 p-2 pb-3 text-shadow-1">
                        <div class="mb-1">
                          <h4 class="fw-bold"  style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${product[i].product_name}</h4>
                          <p class="text-muted">${product[i].category.category_name}</p>
                        </div>
                        <ul class="d-flex list-unstyled mt-3">
                          <li class="me-auto">
                            <button class="btn btn-outline-warning addToProduct" value="${product[i].product_id}"><i class="fas fa-plus "></i></button></li>
                          <li class="d-flex align-items-center">
                            <svg class="bi me-2" width="1em" height="1em"><use xlink:href="#calendar3"/></svg>
                            <strong><small >${product[i].price.toLocaleString('vi', {style : 'currency', currency : 'VND'})}</small></strong>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>`;}
        $('#menuProduct').html(content);
        $(".addToProduct").on("click",function (){
            let id = $(this).attr("value");
            getProduct(id);
        })
    })
}

function createMemberApp(){
    let member_name = $("#member_name").val();
    let phoneNumber = $("#phoneNumber").val();
    let email = $("#email").val();


    let member = {
        member_name: member_name,
        phoneNumber: phoneNumber,
        email : email
    }

    if ($("#create-form").valid()){
        console.log(member)
        $.ajax({
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            type: "POST",
            data: JSON.stringify(member),
            url: "http://localhost:8080/app/createNewMember"
        }).done(function (){
            $("#create-form")[0].reset();
            App.showSuccessAlert("Tạo mới thành viên thành công");
            $("#editModal").modal('hide');
        }).fail(()=>{
            App.showErrorAlert("Đã xảy ra lỗi!");
        })
    }
}

//Tìm kiếm thành viên
function searchByMember(){
    let string = $("#search").val();
    $.ajax({
        type:"GET",
        url: `http://localhost:8080/app/searchMember/${string}`
    }).done(function (member){
        if(member !== "") {
            let content = "";
            for (let i = 0; i < member.length; i++) {
                content += `
                            <tr>
                                <td>${member[i].member_name}</td>
                                <td>${member[i].phoneNumber}</td>
                                <td>${member[i].email}</td>
                                <td>${member[i].aclass.class_name}</td>
                                <td class="text-center">
                                    <button type="button" class="btn btn-outline-primary chooseMember" value="${member[i].member_id}">Chọn</button>
                                </td>
                            </tr>
                        `;
            }
            $("#detailMember").html(content);
            $(".chooseMember").on("click", function (){
                let id = $(this).attr("value");

                $.ajax({
                    type: "GET",
                    url: `http://localhost:8080/app/chooseByMember/${id}`
                }).done(function (member){
                    order.member = member;
                    $("#search").val("");
                    $("#searchModal").modal('hide');
                    drawOrder();
                })
            })
        } else {
            App.showErrorAlert("Chưa đăng ký thành viên!")
        }
    }).fail(function (){
        App.showErrorAlert("Hãy nhập để tìm kiếm!")
    })
}

//Thêm vào danh sách bán hàng
function checkSelected(arr, name){
    for (let i = 0; i < arr.length; i++){
        if (arr[i].product_name === name){
            return i;
        }
    }
    return -1;
}

function getProduct(id){
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/app/findProduct/${id}`,
        success: function (data){
            let productName = data.product_name;
            let indexProduct = checkSelected(order.products,productName);
            if (indexProduct === -1){
                order.products.push(data);
            } else {
                order.products[indexProduct].amount++;
            }
            drawOrder(order);
        }
    })
}

function drawProduct() {
    let content = "<div class=\"current-order panel-body overflow-auto border\">";
    let total = 0;
    if (order.products.length !== 0){
        for (let i = 0; i < order.products.length; i++) {
            total += order.products[i].price * order.products[i].amount;
            content += `
              <ul class="list-group mb-3 ">
                <li class=" d-flex justify-content-between p-3 pb-0 ">
                  <div>
                    <h6 class="my-0" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${order.products[i].product_name}</h6>
                  </div>
                  <div>
                    <p>
                    <i value="${order.products[i].product_id}" class="fas fa-minus btn btn-outline-dark subToProduct"></i>
                      <span class="w-50 text-center"> ${order.products[i].amount}</span>
                      <i value="${order.products[i].product_id}" class="fas fa-plus btn btn-outline-dark addMoreProduct"></i>
                    </p>
                  </div>
                  <span class="text-muted" >${(order.products[i].price*order.products[i].amount).toLocaleString('vi', {style : 'currency', currency : 'VND'})}</span>
                </li>
              </ul>`;
        }
        content += "</div>";

        order.total_product = total;

        $('#orderProductList').html(content);

        $(".addMoreProduct").on("click",function (){
            let id = $(this).attr("value");
            getProduct(id);
        })

        $(".subToProduct").on("click",function (){
            let id = $(this).attr("value");
            subProduct(id);
        })
    }
}

function drawTicket() {
    let total = 0;
    let content = "<div class=\'current-order panel-body overflow-auto border\'>";
    for (let i = 0; i < order.ticket.length; i++) {
        total += order.ticket[i].seat.typeSeat.price
        content += `
          <ul class="list-group mb-1 ">
            <li class=" d-flex justify-content-between p-1 btn delete-ticket" value="${order.ticket[i].seat.seat_id}">
              <div >
                <h6 class="my-0" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis" id="film_name">${order.ticket[i].show.film.film_name}</h6>
                <p>${order.ticket[i].show.schedule.schedule_date} ${order.ticket[i].show.time_start}</p>
              </div>
              <div>
                <p><strong>${order.ticket[i].seat.seat_name}</strong> ${order.ticket[i].seat.typeSeat.type_name}</p>
              </div>
              <span class="text-muted" >${(order.ticket[i].seat.typeSeat.price ).toLocaleString('vi', {
            style: 'currency',
            currency: 'VND'
        })}</span>
            </li>
          </ul><hr>`;
    }
    content += "</div>";
    order.total_ticket = total;
    $("#ticket").html(content);
    $(".delete-ticket").on("click", function (){
        let seatId = $(this).attr("value");
        App.showDeleteConfirmDialog().then((result) => {
            if (result.isConfirmed){
                deleteTicketFromOrder(seatId);
            }
        })
    })
}

function drawOrder(){
    let total_ticket = 0;
    let total_product = 0;
    let content = `<div class="current-order panel-body overflow-auto border" style="height: 180px; margin-bottom: 10px" id="ticket">
                    <div class="current-order panel-body overflow-auto border">`;
    for (let i = 0; i < order.ticket.length; i++) {
        total_ticket += order.ticket[i].seat.typeSeat.price
        content += `
          <ul class="list-group mb-1 ">
            <li class=" d-flex justify-content-between p-1 btn delete-ticket" value="${order.ticket[i].seat.seat_id}">
              <div >
                <h6 class="my-0" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis" id="film_name">${order.ticket[i].show.film.film_name}</h6>
                <p>${order.ticket[i].show.schedule.schedule_date} ${order.ticket[i].show.time_start}</p>
              </div>
              <div>
                <p><strong>${order.ticket[i].seat.seat_name}</strong> ${order.ticket[i].seat.typeSeat.type_name}</p>
              </div>
              <span class="text-muted" >${(order.ticket[i].seat.typeSeat.price ).toLocaleString('vi', {
            style: 'currency',
            currency: 'VND'
        })}</span>
            </li>
          </ul>`;
    }
    content += `</div>
              </div>`;

    order.total_ticket = total_ticket;

    content += `<div class="current-order panel-body overflow-auto border" style="height: 180px; margin-bottom: 10px" id="orderProductList">
               <div class="current-order panel-body overflow-auto border">`
    if (order.products.length !== 0){
        for (let i = 0; i < order.products.length; i++) {
            total_product += order.products[i].price * order.products[i].amount;
            content += `
              <ul class="list-group mb-3 ">
                <li class=" d-flex justify-content-between p-3 pb-0 ">
                  <div>
                    <h6 class="my-0" style="width: 150px; white-space: nowrap;  overflow: hidden; text-overflow: ellipsis">${order.products[i].product_name}</h6>
                  </div>
                  <div>
                    <p>
                    <i value="${order.products[i].product_id}" class="fas fa-minus btn btn-outline-dark subToProduct"></i>
                      <span class="w-50 text-center"> ${order.products[i].amount}</span>
                      <i value="${order.products[i].product_id}" class="fas fa-plus btn btn-outline-dark addMoreProduct"></i>
                    </p>
                  </div>
                  <span class="text-muted" >${(order.products[i].price*order.products[i].amount).toLocaleString('vi', {style : 'currency', currency : 'VND'})}</span>
                </li>
              </ul>`;

        }
    }
    content += `</div>
              </div>`;

    order.total_product = total_product;

    if(order.member !== ""){
        content += `<div class="current-order panel-body border" style="height: 50px;margin-bottom: 10px " id="chooseMemberName">
                <input type="hidden" id="memberId" value="">
                    <ul class="list-group mb-3 ">
                        <li class=" d-flex justify-content-between p-2 pb-0 ">
                          <div>
                            <h5>Thành viên: </h5>
                          </div>
                          <h5 class="btn text-muted deleteMember" value="${order.member.member_id}">${order.member.member_name} (-${order.member.aclass.percent_discount}% CO)</h5>
                          <input type="hidden" id="discount-hidden" value="${order.member.aclass.percent_discount}">
                        </li>
                    </ul>
                </div>`;
        let percent_discount = $("#discount-hidden").val();
        if  (order.total_product !== 0){
            order.total_product = total_product*(100-percent_discount)/100;
        }

    } else {
        content += `<div class="current-order panel-body border" style="height: 50px;margin-bottom: 10px " id="chooseMemberName">
                <input type="hidden" id="memberId" value="">
              </div>`;
    }

    order.total_price = order.total_ticket + order.total_product;

    content += `
      <div class="panel-body border" style="height: 150px; margin-top: 10px">
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tổng</h5>
                  <input hidden id="total" value="">
                  <h5><strong>${order.total_price.toLocaleString('vi', {style : 'currency', currency : 'VND'})}</strong></h5>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Khách đưa</h5>
                  <div class="d-flex justify-content-between">
                    <input type="text" value="" id="received">
                    <span class="input-group-text">đ</span>
                  </div>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tiền thừa</h5>
                  <h5 id="balanced"></h5>
                </div>
              </div>`;

    $("#allList").html(content);
    $(".deleteMember").on("click", function (){
        App.showDeleteConfirmDialog().then((result) => {
            if (result.isConfirmed){
                order.member = "";
                drawOrder();

            }
        });
    })
    $(".delete-ticket").on("click", function (){
        let seatId = $(this).attr("value");
        App.showDeleteConfirmDialog().then((result) => {
            if (result.isConfirmed){
                deleteTicketFromOrder(seatId);
            }
        })
    })
    $(".addMoreProduct").on("click",function (){
        let id = $(this).attr("value");
        getProduct(id);
    })
    $(".subToProduct").on("click",function (){
        let id = $(this).attr("value");
        subProduct(id);
    })
    $("#received").on("input",function (){
        $("#balanced").html(
            `<strong style="color: red;">${$("#received").val() - order.total_price}</strong> đ`
        )
    })
}

function subProduct(id){
    $.ajax({
        type: "GET",
        url: `http://localhost:8080/app/findProduct/${id}`,
        success: function (data){
            let productName = data.product_name;
            let indexProduct = checkSelected(order.products,productName);
            if (order.products[indexProduct].amount === 1){
                order.products.splice(indexProduct,1);
                if (order.products.length === 0){
                    emptyOrder();
                } else {
                    drawOrder();
                }
            } else if(order.products[indexProduct].amount > 1){
                order.products[indexProduct].amount--;
                drawOrder();
            }
        }
    })
}

function emptyOrder(){
    let content = `<div class="current-order panel-body overflow-auto border" style="height: 180px; margin-bottom: 10px" id="ticket">

              </div>
              <div class="current-order panel-body overflow-auto border" style="height: 180px; margin-bottom: 10px" id="orderProductList">

              </div>
              <div class="current-order panel-body overflow-auto border" style="height: 50px;margin-bottom: 10px " id="chooseMemberName">

              </div>`;
    if(order.products.length === 0){
        content += `<div class="panel-body border" style="height: 150px; margin-top: 10px">
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tổng</h5>
                  <input hidden id="total" value="">
                  <h5><strong>${order.total_ticket}</strong></h5>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Khách đưa</h5>
                  <div class="d-flex justify-content-between">
                    <input type="text" value="" id="received">
                    <span class="input-group-text">đ</span>
                  </div>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tiền thừa</h5>
                  <h5 id="balanced"></h5>
                </div>
              </div>`
    } else if(order.ticket.length === 0){
        content += `<div class="panel-body border" style="height: 150px; margin-top: 10px">
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tổng</h5>
                  <input hidden id="total" value="">
                  <h5><strong>${order.total_product}</strong></h5>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Khách đưa</h5>
                  <div class="d-flex justify-content-between">
                    <input type="text" value="" id="received">
                    <span class="input-group-text">đ</span>
                  </div>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tiền thừa</h5>
                  <h5 id="balanced"></h5>
                </div>
              </div>`
    } else {
        content += `<div class="panel-body border" style="height: 150px; margin-top: 10px">
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tổng</h5>
                  <input hidden id="total" value="">
                  <h5><strong>0</strong></h5>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Khách đưa</h5>
                  <div class="d-flex justify-content-between">
                    <input type="text" value="" id="received">
                    <span class="input-group-text">đ</span>
                  </div>
                </div>
                <div class="d-flex justify-content-between p-2 pb-0">
                  <h5>Tiền thừa</h5>
                  <h5 id="balanced"></h5>
                </div>
              </div>`
    }
    $('#allList').html(content);
    drawProduct();
    drawTicket();
}

function updateClassMember(){
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/members/allMember"
    }).done((members) =>{
        for (let i = 0; i < members.length; i++) {
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/visit/findByMemberId/${members[i].member_id}`
            }).done((visits) => {
                if (members[i].aclass.class_id === 1){
                    if  (visits.length >= 25 && visits.length <50) {
                        updateMember(members[i],2);
                    } else if (visits.length >= 50){
                        updateMember(members[i], 3);
                    }
                } else if (members[i].aclass.class_id === 2){
                    if (visits.length < 25) {
                        updateMember(members[i], 1);
                    } else if (visits.length >= 50){
                        updateMember(members[i], 3);
                    }
                } else {
                    if (visits.length < 25) {
                        updateMember(members[i], 1);
                    } else if (visits.length < 50){
                        updateMember(members[i], 2);
                    }
                }
            })
        }
    })
}

function updateMember(member, classId){
    $.ajax({
        type: "PUT",
        url: `http://localhost:8080/members/update/${member.member_id}/${classId}`
    })
}

//Tạo order

function createOrder(){
    let order_date = App.getToday();
    let order_time = App.getTime();
    let total_product = order.total_product;
    let total_ticket = order.total_ticket;
    let total_price = order.total_price;
    let member = order.member.member_id
    let user = $("#username-hidden").val();

    let newMember = {
        member_id : member
    }
    let newUser = {
        username: user
    }

    if (member === undefined){
        let newOrder = {
            order_date : order_date,
            order_time : order_time,
            total_product: total_product,
            total_ticket: total_ticket,
            total_price: total_price,
            user: newUser
        }
        App.showCreateConfirmDialog().then((result) =>{
            if (result.isConfirmed){
                $.ajax({
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    type: "POST",
                    data: JSON.stringify(newOrder),
                    url: `http://localhost:8080/app/saveOrder/${$("#username-hidden").val()}`
                }).done((resp) => {

                    for (let i = 0; i < order.products.length ; i++) {
                        let newOrderDetail = {
                            order :{
                                order_id : resp.order_id
                            },
                            product_name: order.products[i].product_name,
                            product_amount: order.products[i].amount,
                            price: order.products[i].amount*order.products[i].price
                        }
                        $.ajax({
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            type: "POST",
                            data: JSON.stringify(newOrderDetail),
                            url: "http://localhost:8080/app/saveOrderDetail"
                        })
                    }

                    for (let i = 0; i < order.ticket.length ; i++) {
                        let newTicket = {
                            order :{
                                order_id : resp.order_id
                            },
                            price: order.ticket[i].seat.typeSeat.price,
                            show: {
                                show_id:order.ticket[i].show.show_id
                            },
                            seat: {
                                seat_id:order.ticket[i].seat.seat_id
                            }
                        }
                        $.ajax({
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            type: "POST",
                            data: JSON.stringify(newTicket),
                            url: "http://localhost:8080/app/saveTicket"
                        }).done((ticket) => {
                            saveTicket(ticket);
                        })
                    }
                    App.showSuccessAlert("Create new order successfully!");
                    deleteOrder();
                    $(".allSchedule").click();

                })
            }
        })
    } else {
        let newOrder = {
            order_date : order_date,
            order_time : order_time,
            total_product: total_product,
            total_ticket: total_ticket,
            total_price: total_price,
            member : newMember,
            user: newUser
        }
        App.showCreateConfirmDialog().then((result) =>{
            if (result.isConfirmed){
                $.ajax({
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    type: "POST",
                    data: JSON.stringify(newOrder),
                    url: "http://localhost:8080/app/saveOrder"
                }).done((resp) => {
                    for (let i = 0; i < order.products.length ; i++) {
                        let newOrderDetail = {
                            order :{
                                order_id : resp.order_id
                            },
                            product_name: order.products[i].product_name,
                            product_amount: order.products[i].amount,
                            price: order.products[i].amount*order.products[i].price
                        }
                        $.ajax({
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            type: "POST",
                            data: JSON.stringify(newOrderDetail),
                            url: "http://localhost:8080/app/saveOrderDetail",
                        })
                    }
                    for (let i = 0; i < order.ticket.length ; i++) {
                        let newTicket = {
                            order :{
                                order_id : resp.order_id
                            },
                            price: order.ticket[i].seat.typeSeat.price,
                            show: {
                                show_id:order.ticket[i].show.show_id
                            },
                            user: {
                                user: order.user.id
                            },
                            member:{
                                member_id:resp.member.member_id
                            },
                            seat: {
                                seat_id:order.ticket[i].seat.seat_id
                            }
                        }
                        $.ajax({
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            type: "POST",
                            data: JSON.stringify(newTicket),
                            url: "http://localhost:8080/app/saveTicket"
                        }).done((ticket) => {
                            saveTicket(ticket);
                        })
                    }

                    let visit = {
                        rel_date: newOrder.order_date,
                        exp_date: App.addDays(newOrder.order_date, 365),
                        member: newMember
                    }
                    $.ajax({
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        type: "POST",
                        url: "http://localhost:8080/visit/save",
                        data: JSON.stringify(visit)
                    })
                    App.showSuccessAlert("Create new order successfully!");
                    deleteOrder();
                    $(".allSchedule").click();
                })
            }
        })
    }

}

function saveTicket(ticket){
    $.ajax({
        type: "PUT",
        url: `http://localhost:8080/app/setTakenSeat/${ticket.seat.seat_id}`
    })

    $.ajax({
        type: "GET",
        url: `http://localhost:8080/show/findById/${ticket.show.show_id}`
    }).done((show) => {
        $.ajax({
            type: "PUT",
            url: `http://localhost:8080/films/addAdmit/${show.film.film_id}`
        })
    })
}

function deleteOrder(){
    order.products = [];
    order.ticket = [];
    order.total_price = 0;
    order.order_date = "";
    order.order_time = "";
    order.user.username = "";
    order.member = "";
    order.total_product = 0;
    order.total_ticket = 0;
    $("#received").val("");
    $("#balanced").html("");
    emptyOrder()
}

getUser();

$("#searchFilmName").on("input", function (){
    if ($("#searchFilmName").val() === ""){
        getCurrentShow();
    } else {
        searchFilmName();
    }
});

getSchedules();

$(".allSchedule").on("click",getScheduleOfTicket);

//Tạo mới thành viên
$(".createMember").on("click",function (){
    $("#editModal").modal('show');
});

$("#create-button").on("click",createMemberApp);

$.validator.addMethod("validatePhone", function (value, element) {
    return this.optional(element) || /((09|03|07|08|05)+([0-9]{8})\b)/g.test(value);
}, "Hãy nhập số điện thoại hợp lệ!!!");

$(".searchMember").on("click",function (){
    if($("#search").val() !== ""){
        $("#searchModal").modal('show');
        searchByMember();
    } else {
        App.showErrorAlert("Hãy nhập để tìm kiếm!")
    }

});

$(".close-button").on("click",function (){
    $("#search").val("");
    $("#editModal").modal('hide');
});

$(".addToProduct").on("click",function (){
    let id = $(this).attr("value");
    getProduct(id);
})
//Kết thúc order

$("#createToOrder").on("click",createOrder);

$(".allProduct").on("click",allItems)

$(".allProduct").on("click",getAllCategory)

updateClassMember();

$(".clearOrder").on("click", function (){
    emptyOrder();
    checkChoosingSeat();
    drawOrder();
})

$(".logout").on("click", logout);

socket.on("serverResponse", (id, username, seat) => {
    if (seat.seatStatus.id === 2) {
        if (username === $("#username-hidden").val()) {
            $("#s_"+id).addClass("btn-success");
            $("#s_"+id).removeClass("btn-light");  

            $.ajax({
                type: "GET",
                url: `http://localhost:8080/show/findShowByRoomId/${seat.room.room_id}`
            }).done((show) => {
                let newTicket = {
                    seat: seat,
                    show: show
                }
                order.ticket.push(newTicket);
                drawOrder();
            })
        } else {
            $("#s_"+id).addClass("btn-danger seat-view");
            $("#s_"+id).removeClass("btn-light seat"); 
        }
    } else {
        if (username === $("#username-hidden").val()) {
            $("#s_"+id).removeClass("btn-success");
            $("#s_"+id).addClass("btn-light");   
            deleteTicketFromOrder(seat.seat_id); 
        } else {
            
            $("#s_"+id).removeClass("btn-danger seat-view");
            $("#s_"+id).addClass("btn-light seat"); 
        }
    }

    
    
})

socket.on("clearSeatResponse",(username, shows ) => {
        for (let i = 0; i < shows.length; i++) {
            $.ajax({
                type: "GET",
                url: `http://localhost:8080/seat/getSeatsByRoom/${shows[i].room.room_id}`
            }).done((seats) => {
                for (let j = 0; j < seats.length; j++) {
                    if (seats[j].seatStatus.id === 2 && seats[j].user.username === username ){
                        if (username === $("#username-hidden").val()){
                            deleteTicketFromOrder(seats[j].seat_id);
                        } else {
                            $("#s_"+seats[j].seat_id).removeClass("btn-danger seat-view");
                            $("#s_"+seats[j].seat_id).addClass("btn-light seat");
                        }
                    }
                }
            })
        }   
} )

// ALready function
$(() => {
    $("#create-form").validate({
        errorElement: 'div',
        rules: {
            member_name:  {
                required: true,
                minlength: 5,
                maxlength: 50,
            },
            phoneNumber: {
                required: true,
                number: true,
                minlength:10,
                maxlength:11,
                validatePhone:true
            },
            email:{
                required:true
            }
        },

        messages: {
            member_name: {
                required: "Vui lòng nhập họ và tên",
                minlength: "Vui lòng nhập tối thiểu 2 ký tự!",
                maxlength: "Vui lòng nhập tối đa chỉ có 50 ký tự!"
            },
            phoneNumber: {
                required: "Vui lòng nhập số điện thoại!",
                number: "Vui lòng chỉ nhập số",
                minlength: "Vui lòng nhập tối thiểu 10 số!",
                maxlength: "Vui lòng nhập tối đa chỉ có 11 số!"
            },
            email:{
                required:"Vui lòng nhập địa chỉ email"
            }
        },

        submitHandler : createMemberApp
    });
});