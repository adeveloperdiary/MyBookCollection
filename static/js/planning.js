var graph = new joint.dia.Graph;
var selectedLink;
var selected_attribute = {};
var addedEntites = new Map();
var paper;
var selectedRect;
var bCreateLink = false;

function render_planning(saved_data) {
    //document.body.style.zoom = "80%";
    selected_project = undefined
    $('#addEntity').on('click', function () {

        var name = prompt("Please enter step name");
        if (name != null) {
            elem_color = get_random_color()
            var rect_new = new joint.shapes.standard.Rectangle();
            var width = getTextWidth(name, "bold 9pt arial") + 20;
            var height = 30;
            rect_new.resize(width + 20, height);
            rect_new.position(100, 100);
            rect_new.attr({
                body: {
                    fill: elem_color.color1,
                    rx: 5,
                    ry: 5,
                    strokeWidth: 2,
                    stroke: elem_color.color2
                },
                label: {
                    text: name,
                    fill: 'black'
                }
            });
            rect_new.addTo(graph);
        }
    });

    paper = new joint.dia.Paper({
        el: document.getElementById('designer'),
        model: graph,
        width: $('#container').width() - 30,
        height: 300,
        gridSize: 5,
        drawGrid: true,
        background: {
            color: 'rgba(240, 240, 240, 0.5)'
        }
    });


    graph.set(saved_data);

    addEditorListener();
}

function createLink() {
    bCreateLink = true;
}

function resetEditor(paper) {

    var elements = paper.model.getElements();
    for (var i = 0, ii = elements.length; i < ii; i++) {
        var currentElement = elements[i];
        currentElement.attr('body/strokeWidth', 1);
    }
    var links = paper.model.getLinks();
    for (var j = 0, jj = links.length; j < jj; j++) {
        var currentLink = links[j];
        //currentLink.attr('line/stroke', 'black');
        currentLink.attr('line/strokeWidth', 1);
    }

    $('#deleteElement').prop("disabled", true);

    //bCreateErrLink = false;
    //bCreateLink = false;
}

function deleteElement() {
    if (selectedRect != null) {
        addedEntites.delete(selectedRect.attr('label/text'));
        selectedRect.remove();
        $('#deleteElement').prop("disabled", true);
    }
}

function addEditorListener() {

    var graphEle = $('#designer').children("svg").first();
    //Setup  svgpan and zoom, with handlers that set the grid sizing on zoom and pan
    //Handlers not needed if you don't want the dotted grid

    panAndZoom = svgPanZoom(graphEle[0],
        {
            //View Port Selected where Graph is loaded
            viewportSelector: graphEle[0].childNodes[1],
            fit: false,
            center: true,
            controlIconsEnabled: true,
            zoomScaleSensitivity: 0.1,
            panEnabled: false,
            mouseWheelZoomEnabled: false
            /*,
            onZoom: function (scale) {
                currentScale = scale;
                console.log(currentScale)
            }*/
        });

    //Event when a mouse is clicked on an element
    paper.on('element:pointerclick', function (elementView) {
        resetEditor(this);
        var currentElement = elementView.model;
        currentElement.attr('body/strokeWidth', 3);

        if (bCreateLink) {
            //console.log("Link Established between:" + selectedRect.attr('label/text') + "and" + currentElement.attr('label/text'));
            link = new joint.shapes.standard.Link();
            link.source(selectedRect);
            link.target(currentElement);
            if (bCreateLink) {
                bCreateLink = false;
                link.attr('type/text', 'data');
            }
            link.addTo(graph);
            $('#createLink').prop("disabled", true);
        } else {
            $('#createLink').prop("disabled", false);
        }

        selectedRect = currentElement;

        $('#deleteElement').prop("disabled", false);

        render_projects_for_goal()

    });

    paper.on('blank:pointerclick', function () {
        resetEditor(this);
        selectedRect = null;
    });

    //Enable pan when a blank area is click (held) on
    paper.on('blank:pointerdown', function (evt, x, y) {
        panAndZoom.enablePan();
        //console.log(x + ' ' + y);
    });

    //Disable pan when the mouse button is released
    paper.on('blank:pointerup', function (event) {
        panAndZoom.disablePan();
    });


    graph.on('change:size', function (cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {

            cell.set('originalSize', cell.get('size'));
        }
    });

    graph.on('change:position', function (cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {
            cell.set('originalPosition', cell.get('position'));
        }

        var parentId = cell.get('parent');
        if (!parentId) return;

        var parent = graph.getCell(parentId);
        var parentBbox = parent.getBBox();

        if (!parent.get('originalPosition')) parent.set('originalPosition', parent.get('position'));
        if (!parent.get('originalSize')) parent.set('originalSize', parent.get('size'));

        var originalPosition = parent.get('originalPosition');
        var originalSize = parent.get('originalSize');

        var newX = originalPosition.x;
        var newY = originalPosition.y;
        var newCornerX = originalPosition.x + originalSize.width;
        var newCornerY = originalPosition.y + originalSize.height;

        _.each(parent.getEmbeddedCells(), function (child) {

            var childBbox = child.getBBox();

            if (childBbox.x < newX) {
                newX = childBbox.x;
            }
            if (childBbox.y < newY) {
                newY = childBbox.y;
            }
            if (childBbox.corner().x > newCornerX) {
                newCornerX = childBbox.corner().x;
            }
            if (childBbox.corner().y > newCornerY) {
                newCornerY = childBbox.corner().y;
            }
        });


        parent.set({
            position: {x: newX, y: newY},
            size: {width: newCornerX - newX + 10, height: newCornerY - newY + 10}
        }, {skipParentHandler: true});
    });

    paper.on('link:pointerclick', function (linkView) {
        resetEditor(this);

        var currentLink = linkView.model;
        currentLink.attr('line/stroke', '#007bff');
        currentLink.attr('line/strokeWidth', 3);

        selectedLink = currentLink;
        $('#deleteLink').prop("disabled", false);
    });

}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function get_random_color() {
    var h = rand(1, 360);
    var s = 94;
    var l = 94;

    var color1 = 'hsl(' + h + ',' + s + '%,' + l + '%)';
    var color2 = 'hsl(' + h + ',80%,40%)';

    return {color1: color1, color2: color2};
}

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

function deleteLink() {
    selectedLink.remove();
    $('#deleteLink').prop("disabled", true);
}

function savePlan() {
    var jsonObject = graph.toJSON();
    var jsonString = JSON.stringify(jsonObject);

    $.ajax({
        contentType: 'application/json',
        data: jsonString,
        dataType: 'json',
        success: function (data) {
            showAlert('Planning was saved  <strong>successfully</strong>');
        },
        error: function (data) {
            showAlert("<strong>Error </strong> saving planning", 'error');
        },
        processData: false,
        type: 'POST',
        url: "/save_plan"
    });
}

function render_projects_for_goal() {
    $.getJSON('/projects_and_tasks?goal=' + selectedRect.attr('label/text'), function (data) {
        var source = document.getElementById("tasks-goal-template").innerHTML;
        var template = Handlebars.compile(source);
        $('#goal_task').html(template(data));
        all_projects = data
    })
}

function add_new_goal_task(event) {
    if (event.which == 13) {
        add_goal_task()
    }
}

function add_goal_task() {
    console.log(selected_project)
    if (selected_project == undefined) {
        showAlert("Please select a project", 'error');
    } else {
        $.getJSON('/add_task?id=' + selected_project + '&name=' + $('#project_task_name').val(), function (output) {
            if (output.result == "success") {
                showAlert('Task added successfully')
                render_projects_for_goal()
            } else {
                showAlert('Error deleting task', 'error')
            }
        })
    }
}

function remove_goal_project(id) {
    $.getJSON('/remove_project?id=' + id, function (output) {
        if (output.result == "success") {
            showAlert('Project deleted successfully')
            render_projects_for_goal()
        } else {
            showAlert('Error deleting project', 'error')
        }
    })
}

function complete_goal_task(task_id) {
    $.getJSON('/complete_task?project_id=' + selected_project + '&task_id=' + task_id + '&status=' + $('#' + task_id).prop('checked'), function (output) {
        if (output.result == "success") {
            showAlert('Task status changed successfully')
            render_projects_for_goal()
        } else {
            showAlert('Error changing task status', 'error')
        }
    })
}

function delete_goal_task(task_id, parent_id) {
    selected_project = parent_id
    $.getJSON('/delete_task?project_id=' + selected_project + '&task_id=' + task_id, function (output) {
        if (output.result == "success") {
            showAlert('Task deleted successfully')
            render_projects_for_goal()
        } else {
            showAlert('Error deleting task', 'error')
        }
    })
}

function createProject() {
    color = getRandomColor()
    var name = prompt("Please enter project name");
    $.getJSON('/new_project?name=' + name + '&color=' + color + '&goal=' + selectedRect.attr('label/text'), function (output) {
        if (output.result == "success") {
            showAlert('Project created successfully')
            render_projects_for_goal()
        } else {
            showAlert('Error creating project', 'error')
        }
    })

}