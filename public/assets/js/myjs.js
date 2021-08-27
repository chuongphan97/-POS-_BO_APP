
barChart();

$(window).resize(function() {
    window.barChart.redraw();
});

function barChart() {
    $.ajax({
        type:"GET",
        url: "/orders/monthlyRevenue"
    }).done(function (orders){
        let dataArr = [];
        for (let i = 0; i < orders.length; i++) {
            dataArr[i] = {
                y: orders[i].month,
                a: orders[i].total_product,
                b: orders[i].total_ticket
            }
        }

        window.barChart = Morris.Bar({
            element: 'bar-chart',
            data: dataArr,
            xkey: 'y',
            ykeys: ['a', 'b'],
            labels: ['Series A', 'Series B'],
            lineColors: ['#1e88e5','#ff3321'],
            lineWidth: '3px',
            resize: true,
            redraw: true
        });
    })

}