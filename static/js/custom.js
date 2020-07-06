var selected_cat = undefined
var books = {}
var selected_id = undefined
$(document).ready(function () {
    $(".categories").on("click", function () {
        this.blur();
        $(".categories").removeClass('active');
        $(this).addClass('active');

        selected_cat = $(this).attr('data-id')
        selected_count = parseInt($(this).attr('data-count'))

        if (selected_count > 0) {
            if (selected_cat != 'Queue') {
                render_book()
            } else {
                render_queue()
            }
        }
    });
})


function render_book() {
    $.getJSON('/get_books?cat=' + selected_cat, function (data) {
        books = data
        var source = document.getElementById('book-card-template').innerHTML;
        var template = Handlebars.compile(source);
        $('#container').html(template(data));
        $('.chapters').toggle()
    })
}

function send_to_queue(id) {

    $.ajax({
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            showAlert('Book was saved to Queue <strong>successfully</strong>');
        },
        error: function (data) {
            showAlert("<strong>Error </strong> saving Book to queue", 'error');
        },
        processData: false,
        type: 'POST',
        url: "/save_queue?id=" + id
    });
}

function remove_from_queue(id) {
    $.ajax({
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            showAlert('Book was saved to Queue <strong>successfully</strong>');
            render_queue()
        },
        error: function (data) {
            showAlert("<strong>Error </strong> saving Book to queue", 'error');
        },
        processData: false,
        type: 'POST',
        url: "/remove_queue?id=" + id
    });
}

function render_queue() {
    $.getJSON('/get_queue', function (data) {
        books = data
        var source = document.getElementById('queue-card-template').innerHTML;
        var template = Handlebars.compile(source);
        $('#container').html(template(data));
        $('.chapters').toggle()
    })
}


function show_chapters(id) {
    selected_id = id
    $.each(books, function (k, v) {
        if (v.id == id) {
            var source = document.getElementById('chapters-template').innerHTML;
            var template = Handlebars.compile(source);
            $('#display_chapters').html(template(v.chapters));
            $('#showChaptersModal').modal('show');
        }
    })
}

function save_progress() {
    var val = [];
    $('.form-check-input').each(function (i) {
        checked = false
        if ($(this).is(":checked")) {
            checked = true
        }
        val[i] = {'name': $(this).val(), 'completed': checked}
    });

    $('#showChaptersModal').modal('hide');

    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify(val),
        dataType: 'json',
        success: function (data) {
            showAlert('Progress was saved  <strong>successfully</strong>');
            render_book()
        },
        error: function (data) {
            showAlert("<strong>Error </strong> saving progress", 'error');
        },
        processData: false,
        type: 'POST',
        url: "/save_chapters?cat=" + selected_cat + "&id=" + selected_id
    });

}

function save_tag(id) {
    var tags = prompt("Please enter tags ( comma separated)");
    if (tags != null) {
        $.ajax({
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                showAlert('Tags were saved  <strong>successfully</strong>');
                render_book()
            },
            error: function (data) {
                showAlert("<strong>Error </strong> saving Tags", 'error');
            },
            processData: false,
            type: 'POST',
            url: "/save_tags?cat=" + selected_cat + "&id=" + id + "&tags=" + tags
        });
    }

}

function save_notes(id) {


    $.ajax({
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            showAlert('Notes were saved  <strong>successfully</strong>');
        },
        error: function (data) {
            showAlert("<strong>Error </strong> saving Notes", 'error');
        },
        processData: false,
        type: 'POST',
        url: "/save_notes?cat=" + selected_cat + "&id=" + id + "&notes=" + $('#' + id).val()
    });
}

function load_book_from_url() {
    url = $('#idURL').val()
    cat = $('#idCat').val()

    $('#addBookModal').modal('hide');

    if (url.indexOf('amazon') != -1) {
        $.getJSON('/fetch_amazon?cat=' + cat + '&url=' + btoa(url), function (output) {
            if (output.result == "success") {
                showAlert('Book imported successfully')
                render_book()
            } else {
                showAlert('Error importing book', 'error')
            }
        })
    } else if (url.indexOf('oreilly') != -1) {
        $.getJSON('/fetch_oreilly?cat=' + cat + '&url=' + btoa(url), function (output) {
            if (output.result == "success") {
                showAlert('Book imported successfully')
                render_book()
            } else {
                showAlert('Error importing book', 'error')
            }
        })
    } else if (url.indexOf('barnesandnoble') != -1) {
        $.getJSON('/fetch_barnesandnoble?cat=' + cat + '&url=' + btoa(url), function (output) {
            if (output.result == "success") {
                showAlert('Book imported successfully')
                render_book()
            } else {
                showAlert('Error importing book', 'error')
            }
        })
    } else {
        $.getJSON('/fetch_manning?cat=' + cat + '&url=' + btoa(url), function (output) {
            if (output.result == "success") {
                showAlert('Book imported successfully')
                render_book()
            } else {
                showAlert('Error importing book', 'error')
            }
        })
    }
}

function star_rating(id, value) {
    $.ajax({
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            showAlert('Rating was saved  <strong>successfully</strong>');
            render_book()
        },
        error: function (data) {
            showAlert("<strong>Error </strong> saving rating", 'error');
        },
        processData: false,
        type: 'POST',
        url: "/save_rating?cat=" + selected_cat + "&id=" + id + "&rating=" + value
    });
}

function showAlert(msg, type) {

    if (type == undefined) {
        type = 'alert-success';
    } else if (type == 'success') {
        type = 'alert-success';
    } else if (type == 'error') {
        type = 'alert-danger';
    } else if (type == 'warning') {
        type = 'alert-warning';
    } else {
        type = 'success'
    }

    $('#alert-msg').html(msg);
    $('.alert').addClass(type);
    $('.alert').addClass('show');

    setTimeout(function () {
        $('.alert').removeClass("show");
        $('.alert').removeClass(type);
    }, 2000);
}