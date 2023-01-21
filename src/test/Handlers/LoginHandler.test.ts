import { IncomingMessage, ServerResponse } from 'http';
import { LoginHandler } from '../../app/Handlers/LoginHandler';
import { Authorizer } from '../../app/Authorization/Authorizer';
import {
  HTTP_METHODS,
  HTTP_CODES,
  SessionToken,
} from '../../app/Models/ServerModels';
import { Utils } from '../../app/Utils/Utils';

describe('LoginHandler test suite', () => {
  let loginHandler: LoginHandler;

  const requestMock = {
    method: '',
  };
  const responseMock = {
    writeHead: jest.fn(),
    write: jest.fn(),
    statusCode: 0,
  };
  const authorizerMock = {
    generateToken: jest.fn(),
  };
  const getRequestBodyMock = jest.fn();

  beforeEach(() => {
    loginHandler = new LoginHandler(
      requestMock as IncomingMessage,
      responseMock as any,
      authorizerMock as any
    );
    Utils.getRequestBody = getRequestBodyMock;
    requestMock.method = HTTP_METHODS.POST;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const someSessionToken: SessionToken = {
    tokenId: 'someTokenId',
    userName: 'someUsername',
    valid: true,
    expirationTime: new Date(),
    accessRights: [1, 2, 3],
  };

  test('Options request', async () => {
    requestMock.method = HTTP_METHODS.OPTIONS;
    await loginHandler.handleRequest();
    expect(responseMock.writeHead).toBeCalledWith(HTTP_CODES.OK);
  });

  test('not handled http method', async () => {
    requestMock.method = 'someRandomMenthod';
    await loginHandler.handleRequest();
    expect(responseMock.writeHead).not.toBeCalled();
  });

  test('Post request with valid login', async () => {
    getRequestBodyMock.mockReturnValueOnce({
      username: 'someUser',
      password: 'somePassword',
    });
    authorizerMock.generateToken.mockReturnValueOnce(someSessionToken);
    await loginHandler.handleRequest();
    expect(responseMock.statusCode).toBe(HTTP_CODES.CREATED);
    expect(responseMock.writeHead).toBeCalledWith(HTTP_CODES.CREATED, {
      'Content-Type': 'application/json',
    });
    expect(responseMock.write).toBeCalledWith(JSON.stringify(someSessionToken));
  });

  test('Post request with invalid login', async () => {
    getRequestBodyMock.mockReturnValueOnce({
      username: 'someUser',
      password: 'somePassword',
    });
    authorizerMock.generateToken.mockReturnValueOnce(null);
    await loginHandler.handleRequest();
    expect(responseMock.statusCode).toBe(HTTP_CODES.NOT_fOUND);
    expect(responseMock.write).toBeCalledWith('wrong username or password');
  });

  test('Post request with unexpected error', async () => {
    getRequestBodyMock.mockRejectedValueOnce(
      new Error('something went wrong!')
    );
    await loginHandler.handleRequest();
    expect(responseMock.statusCode).toBe(HTTP_CODES.INTERNAL_SERVER_ERROR);
    expect(responseMock.write).toBeCalledWith(
      'Internal error: something went wrong!'
    );
  });
});
