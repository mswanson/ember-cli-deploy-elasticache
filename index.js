/* jshint node: true */
'use strict';

const Promise          = require('ember-cli/lib/ext/promise');
const DeployPluginBase = require('ember-cli-deploy-plugin');
const MAX_PORT_NUMBER  = 65535;
const MIN_PORT_NUMBER  = 49151;

module.exports = {
  name: 'ember-cli-deploy-elasticache',

  createDeployPlugin: function(options) {
    const Tunnel = require('./lib/elasticache-tunnel');

    const DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        elasticachePort: 6379,
        srcPort: function() {
          const range = MAX_PORT_NUMBER - MIN_PORT_NUMBER + 1;
          return Math.floor(Math.random() * range) + MIN_PORT_NUMBER;
        }
      },
      requiredConfig: ['ec2Host','ec2User','ec2KeyFile','elasticacheHost'],

      setup: function(/* context */) {
        const srcPort = this.readConfig('srcPort');

        if (srcPort > MAX_PORT_NUMBER || srcPort < MIN_PORT_NUMBER) {
          throw 'Port ' + srcPort + ' is not available to open a SSH connection on.\n' + 'Please choose a port between ' + MIN_PORT_NUMBER + ' and ' + MAX_PORT_NUMBER + '.';
        }

        const config = {
          srcPort: srcPort,
          ec2User: this.readConfig('ec2User'),
          ec2Host: this.readConfig('ec2Host'),
          ec2KeyFile: this.readConfig('ec2KeyFile'),
          elasticachePort: this.readConfig('elasticachePort'),
          elasticacheHost: this.readConfig('elasticacheHost')
        };

        const tunnel = new Tunnel(config);
        return new Promise((resolve, reject) => {
          tunnel.open().then(() => {
            this.log('Ssh Tunnel is running.', { verbose: true });
            resolve({
              tunnel: {
                handler: tunnel,
                srcPort: srcPort
              }
            });
          }).catch((error) =>{
            this.log(error, { color: 'red' });
            reject(error);
          });
        });
      },

      teardown: function(context) {
        return new Promise((resolve, reject) => {
          context.tunnel.handler.close().then(() => {
            this.log('Ssh Tunnel is closed.', { verbose: true });
            resolve();
          }).catch((error) => {
            this.log(error, { color: 'red' });
            reject(error);
          });
        });
      }
    });
    return new DeployPlugin();
  }
};
