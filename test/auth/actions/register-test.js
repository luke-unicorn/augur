import {
	assert
} from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import testState from '../../testState';
import {
PASSWORD_TOO_SHORT,
PASSWORD_NEEDS_LOWERCASE,
PASSWORD_NEEDS_UPPERCASE,
PASSWORD_NEEDS_NUMBER,
PASSWORD_TOO_SHORT_MSG,
PASSWORD_NEEDS_LOWERCASE_MSG,
PASSWORD_NEEDS_UPPERCASE_MSG,
PASSWORD_NEEDS_NUMBER_MSG,
} from '../../../src/modules/auth/constants/form-errors';

describe(`modules/auth/actions/register.js`, () => {
	proxyquire.noPreserveCache();
	const middlewares = [thunk];
	const mockStore = configureMockStore(middlewares);
	const fakeAugurJS = { augur: { web: {} } };
	const fakeAuthLink = {};
	const fakeSelectors = {};
	const fakeFund = {};
	const updtLoginAccStub = {};
	const ldLoginAccStub = {};
	const autoStub = {};

	let action, clock, store;
	let thisTestState = Object.assign({}, testState, {
		loginAccount: {}
	});
	store = mockStore(thisTestState);
	const fakeCallback = sinon.stub();
	fakeAugurJS.augur.web.register = (name, psswrd, cb) => {
		cb({
			address: 'test',
			id: 'test',
			secureLoginID: 'testid',
			name: name,
			ether: 0,
			realEther: 0,
			rep: 0
		});
	};
	fakeSelectors.links = {
		marketsLink: {
			onClick: () => {}
		},
		loginMessageLink: {
			onClick: () => {}
		},
	};
	fakeAuthLink.selectAuthLink = (page, bool, dispatch) => {
		return { onClick: () => {} };
	};
	fakeFund.addFundNewAccount = sinon.stub().returns({ type: 'FUND_NEW_ACCOUNT' });
	let updateTestString = 'updateLoginAccount(loginAccount) called.';
	let ldLoginAccDepTestString = 'loadLoginAccountDependents() called.';
	let ldLoginAccLSTestString = 'loadLoginAccountLocalStorage(id) called.';

	updtLoginAccStub.updateLoginAccount = sinon.stub().returns({type: updateTestString });
	ldLoginAccStub.loadLoginAccountDependents = sinon.stub().returns({type: ldLoginAccDepTestString });
	ldLoginAccStub.loadLoginAccountLocalStorage = sinon.stub().returns({type: ldLoginAccLSTestString });

	action = proxyquire('../../../src/modules/auth/actions/register', {
		'../../../services/augurjs': fakeAugurJS,
		'../../../selectors': fakeSelectors,
		'../../link/selectors/links': fakeAuthLink,
		'../../auth/actions/update-login-account': updtLoginAccStub,
		'../../auth/actions/load-login-account': ldLoginAccStub,
		'../../transactions/actions/add-fund-new-account-transaction': fakeFund
	});

	beforeEach(() => {
		store.clearActions();
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		store.clearActions();
		clock.restore();
	});

	it(`should register a new account`, () => {
		const expectedOutput = [{
				type: 'updateLoginAccount(loginAccount) called.'
			}, {
				type: 'loadLoginAccountLocalStorage(id) called.'
			}, {
				type: 'updateLoginAccount(loginAccount) called.'
			}, {
				type: 'loadLoginAccountDependents() called.'
			},{
				type: 'FUND_NEW_ACCOUNT'
		}];

		store.dispatch(action.register('newUser', 'Passw0rd', 'Passw0rd', undefined, false, undefined, fakeCallback));
		// Call again to simulate someone pasting loginID and then hitting signUp
		store.dispatch(action.register('newUser', 'Passw0rd', 'Passw0rd', testState.loginAccount.loginID, false, testState.loginAccount, undefined));

		clock.tick(2000);

		assert(fakeCallback.calledOnce, `the callback wasn't triggered 1 time as expected`);
		assert(fakeFund.addFundNewAccount.calledOnce, `addFundNewAccount wasn't called once as expected`);

		assert(ldLoginAccStub.loadLoginAccountDependents.calledOnce, `loadLoginAccountDependents wasn't called once as expected.`);
		assert(ldLoginAccStub.loadLoginAccountLocalStorage.calledOnce, `loadLoginAccountLocalStorage wasn't called once as expected`);
		assert(updtLoginAccStub.updateLoginAccount.calledTwice, `updateLoginAccount wasn't called twice as expected`);
		assert.deepEqual(store.getActions(), expectedOutput, `Didn't create a new account as expected`);
	});

	// it(`should fail with no uppercase letter in passwords entered`, () => {
	// 	const expectedOutput = [ { type: 'AUTH_ERROR',
  //   err: { valid: false, code: PASSWORD_NEEDS_UPPERCASE, message: PASSWORD_NEEDS_UPPERCASE_MSG } } ];
	//
	// 	store.dispatch(action.register('', 't3sting', 't3sting'));
	// 	assert.deepEqual(store.getActions(), expectedOutput, `didn't fail when there was no uppercase letter in the passwords.`);
	// });
	//
	// it(`should fail with no number in passwords entered`, () => {
	// 	const expectedOutput = [ { type: 'AUTH_ERROR',
  //   err: { valid: false, code: PASSWORD_NEEDS_NUMBER, message: PASSWORD_NEEDS_NUMBER_MSG } } ];
	//
	// 	store.dispatch(action.register('', 'Testing', 'Testing'));
	// 	assert.deepEqual(store.getActions(), expectedOutput, `didn't fail when there was no number in the passwords.`);
	// });
	//
	// it(`should fail with no lowercase letter in passwords entered`, () => {
	// 	const expectedOutput = [ { type: 'AUTH_ERROR',
  //   err: { valid: false, code: PASSWORD_NEEDS_LOWERCASE, message: PASSWORD_NEEDS_LOWERCASE_MSG } } ];
	//
	// 	store.dispatch(action.register('', 'T3STING', 'T3STING'));
	// 	assert.deepEqual(store.getActions(), expectedOutput, `didn't fail when there was no lowercase letter in the passwords.`);
	// });
	//
	// it(`should fail when passwords entered are too short.`, () => {
	// 	const expectedOutput = [ { type: 'AUTH_ERROR',
  //   err: { valid: false, code: PASSWORD_TOO_SHORT, message: PASSWORD_TOO_SHORT_MSG } } ];
	//
	// 	store.dispatch(action.register('', 'test', 'test'));
	// 	assert.deepEqual(store.getActions(), expectedOutput, `didn't fail when the passwords where too short.`);
	// });

	it(`should fail with mismatched passwords`, () => {
		const expectedOutput = [{
			type: 'AUTH_ERROR',
			err: {
				code: 'PASSWORDS_DO_NOT_MATCH'
			}
		}, {
			type: 'AUTH_ERROR',
			err: {
				code: 'PASSWORDS_DO_NOT_MATCH'
			}
		}, {
			type: 'AUTH_ERROR',
			err: {
				code: 'PASSWORDS_DO_NOT_MATCH'
			}
		}, {
			type: 'AUTH_ERROR',
			err: {
				code: 'PASSWORDS_DO_NOT_MATCH'
			}
		}];

		store.dispatch(action.register('test', 'test', 'test1'));
		store.dispatch(action.register('test', '', 'test'));
		store.dispatch(action.register('test', 'test2', 'test'));
		store.dispatch(action.register('test', 'test1', 'test2'));

		assert.deepEqual(store.getActions(), expectedOutput, `didn't fail when user doesn't pass a username`);
	});
});
