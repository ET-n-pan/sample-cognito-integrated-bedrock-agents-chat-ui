import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Amplify } from 'aws-amplify';
import {
  Container,
  Header,
  SpaceBetween,
  Form,
  FormField,
  Input,
  Button,
  Select,
} from "@cloudscape-design/components";

/**
 * Component for managing application configuration
 * Handles AWS service configuration and credentials
 * @param {Object} props - Component properties
 * @param {Function} props.onConfigSet - Callback when configuration is saved
 * @param {boolean} props.isEditingConfig - Flag indicating edit mode
 * @param {Function} props.setEditingConfig - Function to update edit mode
 * @returns {JSX.Element} Configuration form interface
 */
const ConfigComponent = ({ onConfigSet, isEditingConfig, setEditingConfig }) => {
  
  /**
   * Configuration state schema
   * Contains AWS service endpoints and credentials
   */
  const [config, setConfig] = useState({
    // Cognito authentication configuration
    cognito: {
      userPoolId: '',
      userPoolClientId: '',
      region: '',
      identityPoolId: ''
    },
    bedrock: {
      agentName: '',
      agentId: '',
      agentAliasId: '',
      region: ''
    },
    strands: {
      enabled: false,
      lambdaArn: '',
      agentName: 'Strandsエージェント',
      region: ''
    }
  });
  const [errors, setErrors] = useState({});

  const configureAmplify = useCallback((config) => {
    Amplify.configure({
      Auth: {
        Cognito: {
          region: config.cognito.region,
          userPoolId: config.cognito.userPoolId,
          userPoolClientId: config.cognito.userPoolClientId,
          identityPoolId: config.cognito.identityPoolId
        },
      }
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate Cognito fields
    if (!config.cognito.userPoolId.trim()) {
      newErrors.userPoolId = 'ユーザープールIDは必須です';
    }
    if (!config.cognito.userPoolClientId.trim()) {
      newErrors.userPoolClientId = 'ユーザープールクライアントIDは必須です';
    }
    if (!config.cognito.identityPoolId.trim()) {
      newErrors.identityPoolId = 'アイデンティティプールIDは必須です';
    }
    if (!config.cognito.region.trim()) {
      newErrors.cognitoRegion = 'Cognitoリージョンは必須です';
    }

    // Validate Bedrock fields if Strands Agent is not enabled
    if (!config.strands.enabled) {
      if (!config.bedrock.agentId.trim()) {
        newErrors.agentId = 'エージェントIDは必須です';
      }
      if (!config.bedrock.agentAliasId.trim()) {
        newErrors.agentAliasId = 'エージェントエイリアスIDは必須です';
      }
      if (!config.bedrock.region.trim()) {
        newErrors.bedrockRegion = 'Bedrockリージョンは必須です';
      }
    }
    
    // Validate Strands fields if enabled
    if (config.strands.enabled) {
      if (!config.strands.lambdaArn.trim()) {
        newErrors.lambdaArn = 'Lambda ARNは必須です';
      }
      if (!config.strands.region.trim()) {
        newErrors.strandsRegion = 'リージョンは必須です';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const storedConfig = localStorage.getItem('appConfig');
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      
      // Ensure the strands object exists with default values if missing
      if (!parsedConfig.strands) {
        parsedConfig.strands = {
          enabled: false,
          lambdaArn: '',
          agentName: 'Strandsエージェント',
          region: ''
        };
      }
      
      if (!isEditingConfig) {
        configureAmplify(parsedConfig);
      } else {
        console.log("loading configuration");
        setConfig(parsedConfig);
      }
    }
  }, [isEditingConfig, onConfigSet, configureAmplify]);

  const handleInputChange = (section, field, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [field]: value
      }
    }));
  };

  // Extract region from Lambda ARN if it's a valid ARN
  const extractRegionFromLambdaArn = (arn) => {
    // Validate if it's a Lambda ARN format: arn:aws:lambda:REGION:ACCOUNT:function:NAME
    const arnPattern = /^arn:aws:lambda:([a-z0-9-]+):\d+:function:.+$/;
    const match = arn.match(arnPattern);
    
    if (match && match[1]) {
      return match[1]; // Return the extracted region
    }
    return ''; // Return empty string if not a valid Lambda ARN
  };

  // Update Strands region when Lambda ARN changes
  useEffect(() => {
    if (config.strands.enabled && config.strands.lambdaArn) {
      const region = extractRegionFromLambdaArn(config.strands.lambdaArn);
      if (region) {
        handleInputChange('strands', 'region', region);
      }
    }
  }, [config.strands.lambdaArn, config.strands.enabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      localStorage.setItem('appConfig', JSON.stringify(config));
      configureAmplify(config);
      setEditingConfig(false);
      onConfigSet();
    }
  };

  return (
    // <ContentLayout>
      <div style={{ maxWidth: '600px', margin: '0 auto', overflow: 'auto', height: '100vh'}}>
        <Container>
          <div style={{ width: '100%', marginBottom: '10px', borderBottom: '1px solid #c3c3c3', paddingBottom: '5px'}}>
            <Header
              variant="h1"
              description="Amazon Bedrockエージェントクライアントアプリケーションを設定しましょう"
              headingTagOverride="h1"
              textAlign="left"
            >
              ようこそ
            </Header>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" formAction="submit">
                    {isEditingConfig ? "設定を更新" : "設定を保存"}
                  </Button>
                  <Button variant="link" onClick={() => setEditingConfig(false)}>
                    キャンセル
                  </Button>
                </SpaceBetween>
              }
            >
              <SpaceBetween size="l">
                <Container
                  header={
                    <Header variant="h2">Amazon Cognito設定</Header>
                  }
                >
                  <SpaceBetween size="l">
                    <FormField 
                      label="ユーザープールID" 
                      isRequired 
                      errorText={errors.userPoolId}
                    >
                      <Input
                        value={config.cognito.userPoolId}
                        isRequired
                        placeholder='例: us-east-1_uXboG5pAb'
                        onChange={({ detail }) => {
                          handleInputChange('cognito', 'userPoolId', detail.value);
                          setErrors({...errors, userPoolId: ''});
                        }}
                      />
                    </FormField>
                    <FormField 
                      label="ユーザープールクライアントID" 
                      isRequired 
                      errorText={errors.userPoolClientId}
                    >
                      <Input
                        value={config.cognito.userPoolClientId}
                        isRequired
                        placeholder='例: 25ddkmj4v6hfsfvruhpfi7n4hv'
                        onChange={({ detail }) => {
                          handleInputChange('cognito', 'userPoolClientId', detail.value);
                          setErrors({...errors, userPoolClientId: ''});
                        }}
                      />
                    </FormField>
                    <FormField 
                      label="アイデンティティプールID" 
                      isRequired
                      errorText={errors.identityPoolId}
                    >
                      <Input
                        value={config.cognito.identityPoolId}
                        isRequired
                        placeholder='例: us-east-1:a0421ced-2ae0-45ab-a503-21f6f23c5562'
                        onChange={({ detail }) => {
                          handleInputChange('cognito', 'identityPoolId', detail.value);
                          setErrors({...errors, identityPoolId: ''});
                        }}
                      />
                    </FormField>
                    <FormField 
                      label="リージョン" 
                      isRequired
                      errorText={errors.cognitoRegion}
                    >
                      <Input
                        value={config.cognito.region}
                        isRequired
                        placeholder='例: us-east-1'
                        onChange={({ detail }) => {
                          handleInputChange('cognito', 'region', detail.value);
                          setErrors({...errors, cognitoRegion: ''});
                        }}
                      />
                    </FormField>
                  </SpaceBetween>
                </Container>
            
                <Container
                  header={
                    <Header variant="h2">エージェント選択</Header>
                  }
                >
                  <SpaceBetween size="l">
                    <FormField 
                      label="エージェントタイプを選択"
                    >
                      <Select
                        selectedOption={{
                          value: config.strands.enabled ? 'strands' : 'bedrock',
                          label: config.strands.enabled ? 'Strandsエージェント' : 'Bedrockエージェント'
                        }}
                        onChange={({ detail }) => {
                          setConfig(prevConfig => ({
                            ...prevConfig,
                            strands: {
                              ...prevConfig.strands,
                              enabled: detail.selectedOption.value === 'strands'
                            }
                          }));
                        }}
                        options={[
                          { value: 'bedrock', label: 'Bedrockエージェント' },
                          { value: 'strands', label: 'Strandsエージェント' }
                        ]}
                      />
                    </FormField>
                  </SpaceBetween>
                </Container>
            
                {!config.strands.enabled && (
                  <Container
                    header={
                      <Header variant="h2">Amazon Bedrockエージェント設定</Header>
                    }
                  >
                    <SpaceBetween size="l">
                      <FormField 
                        label="エージェント名"
                        errorText={errors.agentName}
                      >
                        <Input
                          value={config.bedrock.agentName}
                          placeholder='例: MyAgent'
                          onChange={({ detail }) => {
                            handleInputChange('bedrock', 'agentName', detail.value);
                            setErrors({...errors, agentName: ''});
                          }}
                        />
                      </FormField>
                      <FormField 
                        label="エージェントID" 
                        isRequired
                        errorText={errors.agentId}
                      >
                        <Input
                          value={config.bedrock.agentId}
                          isRequired
                          placeholder='例: UF1W5WKVYI'
                          onChange={({ detail }) => {
                            handleInputChange('bedrock', 'agentId', detail.value);
                            setErrors({...errors, agentId: ''});
                          }}
                        />
                      </FormField>
                      <FormField 
                        label="エージェントエイリアスID" 
                        isRequired
                        errorText={errors.agentAliasId}
                      >
                        <Input
                          value={config.bedrock.agentAliasId}
                          isRequired
                          placeholder='例: TSTALIASID (デフォルトではドラフトを指します)'
                          onChange={({ detail }) => {
                            handleInputChange('bedrock', 'agentAliasId', detail.value);
                            setErrors({...errors, agentAliasId: ''});
                          }}
                        />
                      </FormField>
                      <FormField 
                        label="リージョン" 
                        isRequired
                        errorText={errors.bedrockRegion}
                      >
                        <Input
                          value={config.bedrock.region}
                          isRequired
                          placeholder='例: us-east-1'
                          onChange={({ detail }) => {
                            handleInputChange('bedrock', 'region', detail.value);
                            setErrors({...errors, bedrockRegion: ''});
                          }}
                        />
                      </FormField>
                    </SpaceBetween>
                  </Container>
                )}

                {config.strands.enabled && (
                  <Container
                    header={
                      <Header variant="h2">Strandsエージェント設定</Header>
                    }
                  >
                    <SpaceBetween size="l">
                      <FormField 
                        label="エージェント名"
                        errorText={errors.strandsAgentName}
                      >
                        <Input
                          value={config.strands.agentName}
                          placeholder='例: 天気エージェント'
                          onChange={({ detail }) => {
                            handleInputChange('strands', 'agentName', detail.value);
                            setErrors({...errors, strandsAgentName: ''});
                          }}
                        />
                      </FormField>
                      <FormField 
                        label="Lambda ARN" 
                        isRequired
                        errorText={errors.lambdaArn}
                      >
                        <Input
                          value={config.strands.lambdaArn}
                          isRequired
                          placeholder='例: arn:aws:lambda:us-east-1:123456789012:function:my-strands-agent'
                          onChange={({ detail }) => {
                            handleInputChange('strands', 'lambdaArn', detail.value);
                            setErrors({...errors, lambdaArn: ''});
                          }}
                        />
                      </FormField>
                      <FormField 
                        label="リージョン" 
                        isRequired
                        errorText={errors.strandsRegion}
                        description="有効なLambda ARNから自動検出されます"
                      >
                        <Input
                          value={config.strands.region}
                          isRequired
                          placeholder='例: us-east-1'
                          disabled={!!extractRegionFromLambdaArn(config.strands.lambdaArn)}
                          onChange={({ detail }) => {
                            handleInputChange('strands', 'region', detail.value);
                            setErrors({...errors, strandsRegion: ''});
                          }}
                        />
                      </FormField>
                    </SpaceBetween>
                  </Container>
                )}
              </SpaceBetween>
            </Form>
          </form>
        </Container>
      </div>
    // </ContentLayout>
  );
};

ConfigComponent.propTypes = {
  onConfigSet: PropTypes.func.isRequired,
  setEditingConfig: PropTypes.func.isRequired,
  isEditingConfig: PropTypes.bool.isRequired
};

export default ConfigComponent;