/**
 * Client
 */
if (Meteor.isClient) {

    // This code only runs on the client
    angular.module('equationKPIs', ['angular-meteor']);

    angular.module('equationKPIs').controller('EquationKPICtrl', ['$scope',
        function ($scope) {

            /**
             * Beanstalk
             */

            $scope.commitFeed = [];

            Meteor.call("beanstalk_CommitFeed", function (error, results) {
                var json = JSON.parse(results);
                console.log(json);
                for(var i = 0; i < json.length; i++) {
                    $scope.commitFeed.push({
                        'revision': json[i].revision_cache.revision,
                        'message': json[i].revision_cache.message,
                        'author': json[i].revision_cache.author,
                        'time': json[i].revision_cache.time
                    });
                    $scope.$apply();
                }
            });

            /**
             * Zendesk
             */

            $scope.tickets = [];

            Meteor.call("zendesk_UnsolvedTickets", function (error, results) {
                var json = JSON.parse(results);
                $scope.tickets.push({
                    'name': 'Unsolved Tickets',
                    'value': json.view_count.pretty
                });
                console.log($scope.metrics);
                $scope.$apply();
            });

            Meteor.call("zendesk_OpenTickets", function (error, results) {
                var json = JSON.parse(results);
                $scope.tickets.push({
                    'name': 'Open Tickets',
                    'value': json.view_count.pretty
                });
                console.log($scope.metrics);
                $scope.$apply();
            });

            /**
             * Mingle
             */

            $scope.sprints = [];
            $scope.sprintOwners = [];
            $scope.sprintsYTD = [];
            $scope.sprintOwnersYTD = [];

            Meteor.call("mingle_SprintStatus", function (error, results) {
                var json = JSON.parse(results);
                for(var i = 0; i < json.length; i++) {
                    $scope.sprints.push({
                        'status': json[i].Status,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

            Meteor.call("mingle_SprintOwnerCompletion", function (error, results) {
                var json = JSON.parse(results);
                for(var i = 0; i < json.length; i++) {
                    $scope.sprintOwners.push({
                        'owner': json[i].Owner,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

            Meteor.call("mingle_YTDOwnerCompletion", function (error, results) {
                var json = JSON.parse(results);
                for(var i = 0; i < json.length; i++) {
                    $scope.sprintOwnersYTD.push({
                        'owner': json[i].Owner,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

            Meteor.call("mingle_YTDSprintCompletion", function (error, results) {
                var json = JSON.parse(results);
                for(var i = 0; i < json.length; i++) {
                    $scope.sprintsYTD.push({
                        'sprint': json[i].Sprint,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

        }]);
}

/**
 * Server
 */
if (Meteor.isServer) {

    /**
     * NPM Modules
     */
    var request = Meteor.npmRequire('request');

    /**
     * Zendesk
     * @type {string}
     */
    var ZendeskUsername = 'gortiz@equationconsulting.com',
        ZendeskPassword = '2tarBuck2',
        ZendeskUrl = 'https://equationconsulting.zendesk.com/api/v2/views/',
        ZendeskAuth = 'Basic ' + new Buffer(ZendeskUsername + ':' + ZendeskPassword).toString('base64');

    var ZendeskOptions = {
        method: 'GET',
        url: ZendeskUrl,
        headers: {
            'Authorization': ZendeskAuth
        }
    };

    /**
     * Mingle
     * @type {string}
     */
    var MingleUsername = 'gortiz@equationconsulting.com',
        MinglePassword = '3ataRiver!',
        MingleUrl = 'https://eqc.mingle.thoughtworks.com/api/v2/projects/datariver/cards/execute_mql.json',
        MingleAuth = 'Basic ' + new Buffer(MingleUsername + ':' + MinglePassword).toString('base64'),
        MingleActiveSprint = '529',
        MingleStartSprint = '529';

    var MingleOptions = {
        method: 'GET',
        url: MingleUrl,
        headers: {
            'Authorization': MingleAuth
        }
    };

    /**
     * Beanstalk
     * @type {string}
     */
    var BeanstalkUsername = 'georgeortiz',
        BeanstalkPassword = 'dd3f4245ac7727986d611eb01d4b18e7a28f95aa34b75556',
        BeanstalkAuth = 'Basic ' + new Buffer(BeanstalkUsername + ':' + BeanstalkPassword).toString('base64');

    var BeanstalkOptions = {
        method: 'GET',
        headers: {
            'Authorization': BeanstalkAuth
        }
    };

    /**
     * Methods
     */
    Meteor.methods({
        zendesk_UnsolvedTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '32396347/count.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        zendesk_OpenTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '38506605/count.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        mingle_SprintStatus: function () {
            var mingle = Async.runSync(function (done) {
                var MingleQuery = 'SELECT status, count(*) WHERE Type=Story and Sprint=NUMBER ' + MingleActiveSprint + ' group by status';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_SprintOwnerCompletion: function () {
            var mingle = Async.runSync(function (done) {
                MingleQuery = 'SELECT Owner, Count(*) WHERE Type=Story and Sprint=NUMBER ' + MingleActiveSprint + ' and (Status=Done or Status=Stage or Status="Ready for Live")';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_YTDOwnerCompletion: function () {
            var mingle = Async.runSync(function (done) {
                MingleQuery = 'select owner, count(*) where sprint >= number ' + MingleStartSprint + ' and (Status=Done or Status=Stage or Status="Ready for Live") group by owner';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_YTDSprintCompletion: function () {
            var mingle = Async.runSync(function (done) {
                MingleQuery = 'select sprint, count(*) where sprint >= number ' + MingleStartSprint + ' and (Status=Done or Status=Stage or Status="Ready for Live") group by sprint';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        beanstalk_CommitFeed: function () {
            var beanstalk = Async.runSync(function (done) {
                BeanstalkOptions.url = 'https://eqc.beanstalkapp.com/api/changesets/repository.json?repository_id=datariver';
                request(BeanstalkOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return beanstalk.result;
        }
    });
}
