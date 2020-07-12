var selected_cat = undefined
var books = {}
var selected_id = undefined
var all_projects = undefined
var selected_project = undefined
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

    $('.tasks').on('click', function () {
        render_projects()
    })

    render_projects()
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


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function render_projects() {
    $.getJSON('/projects_and_tasks', function (data) {
        var source = document.getElementById("tasks-template").innerHTML;
        var template = Handlebars.compile(source);
        $('#container').html(template(data));
        all_projects = data
    })
}

function create_new_project() {

    color = getRandomColor()
    $.getJSON('/new_project?name=' + $('#project_task_name').val() + '&color=' + color, function (output) {
        if (output.result == "success") {
            showAlert('Project created successfully')
            render_projects()
        } else {
            showAlert('Error creating project', 'error')
        }
    })


}

function select_card(id) {

    $('.projects').css('border', '')

    $.each(all_projects, function (k, v) {
        if (v.id == id) {
            $('#' + id).css('border', '1px solid' + v.color)
        }
    })

    selected_project = id
}

function add_new_task(event) {
    if (event.which == 13) {
        add_task()
    }
}

function add_task() {
    $.getJSON('/add_task?id=' + selected_project + '&name=' + $('#project_task_name').val(), function (output) {
        if (output.result == "success") {
            showAlert('Task added successfully')
            render_projects()
        } else {
            showAlert('Error deleting task', 'error')
        }
    })
}

function complete_task(task_id) {
    $.getJSON('/complete_task?project_id=' + selected_project + '&task_id=' + task_id + '&status=' + $('#' + task_id).prop('checked'), function (output) {
        if (output.result == "success") {
            showAlert('Task status changed successfully')
            render_projects()
        } else {
            showAlert('Error changing task status', 'error')
        }
    })
}

function remove_project(id) {
    $.getJSON('/remove_project?id=' + id, function (output) {
        if (output.result == "success") {
            showAlert('Project deleted successfully')
            render_projects()
        } else {
            showAlert('Error deleting project', 'error')
        }
    })
}


function delete_task(task_id, parent_id) {
    selected_project = parent_id
    $.getJSON('/delete_task?project_id=' + selected_project + '&task_id=' + task_id, function (output) {
        if (output.result == "success") {
            showAlert('Task deleted successfully')
            render_projects()
        } else {
            showAlert('Error deleting task', 'error')
        }
    })
}


function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}