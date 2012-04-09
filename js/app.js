(function ($) {
    
    // dummy data, array of model objects
    var contacts = [
        { name: "Contact 1", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "family" },
        { name: "Contact 2", address: "2, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "family" },
        { name: "Contact 3", address: "3, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "friend" },
        { name: "Contact 4", address: "4, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "colleague" },
        { name: "Contact 5", address: "5, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "family" },
        { name: "Contact 6", address: "6, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "colleague" },
        { name: "Contact 7", address: "7, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "friend" },
        { name: "Contact 8", address: "8, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: "family" }
    ];
    
    // each contact has its own model
    var Contact = Backbone.Model.extend({
        defaults: {
            photo: "images/profile-placeholder.png",
            name: '',
            address: '',
            type: 'friend',
            email: '',
            tel: ''
        }
    });
    
    // a group of several contacts
    var Directory = Backbone.Collection.extend({
        model: Contact
    });
    
    // a view for each contact
    var ContactView = Backbone.View.extend({
        tagName: 'article',
        className: 'contact-container',
        template: $('#contact-template').html(),
        editTemplate: _.template($('#contact-edit-template').html()),
        render: function () {
            var tmpl = _.template(this.template);
            this.$el.html(tmpl(this.model.toJSON()));
            return this;
        },
        events: {
            "click .delete": 'deleteContact',
            "click .edit": 'editContact',
            "change select.type": 'addType',
            "click .save": 'saveEdits',
            "click .cancel": 'cancelEdits'
        },
        deleteContact: function() {
            var removedType = this.model.get('type').toLowerCase();
            // delete the model
            this.model.destroy();
            // remove the model from the page
            this.remove();
            // delete the type if there's no existing contact left
            // with this type
            if (_.indexOf(directory.getTypes(), removedType) === -1) {
                $('#filter select').children('[value=' + removedType + ']').remove();
            }
        },
        editContact: function() {
            this.$el.html(this.editTemplate(this.model.toJSON()));
            var newOpt = $('<option/>', {
                html: '<em>Add new...</em>',
                value: 'addType'
            });
            this.select = directory.createSelect().addClass('type')
                            .val(this.$el.find('#type').val()).append(newOpt)
                            .insertAfter(this.$el.find('.name'));
            this.$el.find('input[type=hidden]').remove();
        },
        addType: function() {
            if (this.select.val() === 'addType') {
                this.select.remove();
                $('<input />', {
                    'class': 'type',
                }).insertAfter(this.$el.find('.name')).focus();
            }
        },
        saveEdits: function(e) {
            e.preventDefault();
            // sets new model's attributes
            var formData = {},
                prev = this.model.previousAttributes();
            $(e.target).closest('form').find(':input').not('button').each(function () {
                var el = $(this);
                formData[el.attr('class')] = el.val();
            });
            // if no photo uploaded, delete the photo attribute so
            // it will use default photo value
            if (formData.photo === '') {
                delete formData.photo;
            }
            // pass new attributes to the model
            this.model.set(formData);
            this.render();
            // delete current model's data in contacts
            if (prev.photo === 'images/profile-placeholder.png') {
                delete prev.photo;
            }
            _.each(contacts, function(contact) {
                if (_.isEqual(contact, prev)) {
                    contacts.splice(_.indexOf(contacts, contact), 1, formData);
                }
            });
        },
        cancelEdits: function(e) {
            e.preventDefault();
            this.render();
        }
    });
    
    // a view for a collection of contacts
    var DirectoryView = Backbone.View.extend({
        el: $('#contacts'),
        initialize: function() {
            /* First render */
            this.collection = new Directory(contacts);
            this.render();
            // put all contact types to dropdown for filter
            this.$el.find('#filter').append(this.createSelect());
            
            /* Event bindings */
            // filter the contact collection on 'change' event on filterType
            this.on('change:filterType', this.filterByType, this);
            // re-render the contact collection's view
            this.collection.on('reset', this.render, this);
            // re-render the contact collection after new contact has been added
            this.collection.on('add', this.renderContact, this);
            // delete the contact
            this.collection.on('remove', this.removeContact, this);
        },
        // render all the contacts by calling renderContact per model
        render: function() {
            var that = this;
            // remove existing contacts first
            this.$el.find('article').remove();
            _.each(this.collection.models, function(item) {
                that.renderContact(item);
            }, this);
        },
        // render each contact
        renderContact: function(item) {
            var contactView = new ContactView({
                model: item
            });
            this.$el.append(contactView.render().el);
        },
        // get all contact types
        getTypes: function() {
            return _.uniq(this.collection.pluck('type'), false, function(item) {
                return item.toLowerCase();
            });
        },
        // create dropdown for types
        createSelect: function() {
            var filter = this.$el.find('#filter'),
                select = $('<select/>', {
                    html: "<option>All</option>"
                });
            _.each(this.getTypes(), function(item) {
                var option = $('<option/>', {
                        value: item,
                        text: item
                    }).appendTo(select);
            });
            return select;
        },
        // attach 'change' event to dropdown
        events: {
            "change #filter select": "setFilter",
            "click #add": "addContact",
            "click #show-form": "toggleForm"
        },
        // event handler for dropdown's 'change' event
        setFilter: function(e) {
            this.filterType = e.currentTarget.value;
            this.trigger('change:filterType');
        },
        // filter by type
        filterByType: function() {
            if (this.filterType.toLowerCase() === 'all') {
                this.collection.reset(contacts);
                // navigate the url
                contactsRouter.navigate('filter/all');
            } else {
                this.collection.reset(contacts, { silent: true });
                var filterType = this.filterType,
                    filtered = _.filter(this.collection.models, function(item) {
                        return item.get('type').toLowerCase() === filterType;
                    });
                this.collection.reset(filtered);
                // navigate the url
                contactsRouter.navigate('filter/' + filterType);
            }
        },
        addContact: function(e) {
            var newModel = {};
            e.preventDefault();        
            $('#add-contact').children('input').each(function(i, el) {
                var val = $(el).val();
                if (val !== '') {
                    newModel[el.id] = val;
                }
            });
            if (_.isEmpty(newModel)) {
                alert("Please fill the form.");
                throw new Error("The form needs to be filled.");
                // or...
                // return;
            }
            // add this contact to the contacts set
            contacts.push(newModel);
            // refresh filter if new type is added
            if (_.indexOf(this.getTypes(), newModel.type) === -1) {
                // add to collection
                this.collection.add(new Contact(newModel));
                this.$('#filter').find('select').remove().end().append(this.createSelect());
            } else {
                // add to collection
                this.collection.add(new Contact(newModel));
            }
        },
        removeContact: function(removedModel) {
            var removed = removedModel.attributes;
            if (removed.photo === 'images/profile-placeholder.png') {
                delete removed.photo;
            }
            // remove contact from the set
            _.each(contacts, function(contact) {
                if (_.isEqual(contact, removed)) {
                    contacts.splice(_.indexOf(contacts, contact), 1);
                }
            });
        },
        toggleForm: function(e) {
            e.preventDefault();
            $('#add-contact').stop().slideToggle();
        }
    });
    
    // router
    var ContactsRouter = Backbone.Router.extend({
        routes: {
            'filter/:type': 'urlFilter'
        },
        urlFilter: function(type) {
            directory.filterType = type;
            directory.trigger('change:filterType');
        }
    });
    
    // instantiations
    var directory = new DirectoryView(),
        contactsRouter = new ContactsRouter();
        
    // enable history
    Backbone.history.start();
    
})(jQuery);